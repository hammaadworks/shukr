import type { AppConfig } from '../hooks/useAppConfig';
import { SUPPORTED_LANGS } from './languages';

export interface AISuggestion {
  translations?: Record<string, string>;
  translation?: string;
  transliterations: Record<string, any>;
  icon?: string;
  shape?: string;
}

const SYSTEM_PROMPT = `You are a linguist and AAC expert. Generate high-quality data for an AAC app.
RULES:
1. TRANSLATION: EXACTLY ONE WORD per language. Avoid phrases (e.g., use "Mukammal" instead of "Mukammal karna").
2. TRANSLITERATION: Phonetic spelling of source word in target script. (e.g., English "Apple" in Urdu is "ایپل").
3. ICON: Suggest the most relevant Lucide icon name (kebab-case).
4. SHAPE: A simple descriptive word for the visual concept (e.g., "circle", "square", "tick", "cross").
5. TOKEN EFFICIENCY: Respond ONLY with the requested JSON.`;

export const aiProvider = {
  async getSuggestion(wordOrText: string, config: AppConfig, feedback?: string): Promise<AISuggestion | null> {
    const langCodes = SUPPORTED_LANGS.map(l => l.code);
    const feedbackSection = feedback ? `\nUSER FEEDBACK: "${feedback}"\nPlease adjust the previous response based on this feedback.` : '';
    const prompt = `Input: "${wordOrText}"${feedbackSection}
Schema: {
  "translations": { ${langCodes.map(c => `"${c}": "single_word"`).join(', ')} },
  "transliterations": { ${langCodes.map(src => `"${src}": { ${langCodes.filter(t => t !== src).map(t => `"${t}": "phonetic"`).join(', ')} }`).join(', ')} },
  "icon": "lucide_icon_name",
  "shape": "descriptive_shape"
}`;
    return this.callAI(prompt, config, 'data_gen');
  },

  async getSingleLanguageSuggestion(wordOrText: string, targetLang: string, config: AppConfig, withRecommendations: boolean = false, feedback?: string): Promise<AISuggestion | null> {
    const otherLangs = SUPPORTED_LANGS.filter(l => l.code !== targetLang);
    const recommendationsSchema = withRecommendations ? `,
  "icon": "lucide_icon_name",
  "shape": "descriptive_shape"` : '';
    
    const feedbackSection = feedback ? `\nUSER FEEDBACK: "${feedback}"\nPlease adjust the previous response based on this feedback.` : '';
    const prompt = `Input: "${wordOrText}" to ${targetLang}${feedbackSection}
Schema: {
  "translation": "single_word",
  "transliterations": { ${otherLangs.map(l => `"${l.code}": "phonetic"`).join(', ')} }${recommendationsSchema}
}`;
    return this.callAI(prompt, config, 'data_gen');
  },

  async generateTTS(text: string, language: string, config: AppConfig, gender: 'male' | 'female' = 'male'): Promise<Blob | null> {
    const ai = config.ai_config?.tts;
    if (!ai) throw new Error('AI configuration for TTS is missing.');
    if (!ai.apiKey) throw new Error('AI API Key for TTS is missing. Please provide it in AI Settings.');

    const model = ai.model || 'gemini-2.5-flash-preview-tts'; 
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${ai.apiKey}`;

    const voiceName = gender === 'female' ? 'Aoede' : 'Charon';
    const prompt = `Say the following word in ${language}: "${text}"`;

    const body: any = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: voiceName
            }
          }
        }
      }
    };

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errText = await res.text();
        let errJson;
        try { errJson = JSON.parse(errText); } catch(e) {}
        throw new Error(`AI TTS error (${res.status}): ${errJson?.error?.message || errText}`);
      }

      const data = await res.json();
      const parts = data?.candidates?.[0]?.content?.parts || [];
      const audioPart = parts.find((p: any) => p.inlineData && p.inlineData.mimeType?.startsWith('audio/'));
      
      if (!audioPart || !audioPart.inlineData?.data) {
        throw new Error('No audio data received. Ensure the model supports speech generation.');
      }

      const mimeType = audioPart.inlineData.mimeType;
      const rawData = audioPart.inlineData.data;

      let buffer: Uint8Array;
      if (mimeType.includes('format=l16')) {
         buffer = this.createWavFromPcm(rawData, mimeType);
      } else {
         const binaryString = atob(rawData);
         buffer = new Uint8Array(binaryString.length);
         for (let i = 0; i < binaryString.length; i++) {
           buffer[i] = binaryString.charCodeAt(i);
         }
      }

      return new Blob([buffer as any], { type: 'audio/wav' });
    } catch (e: any) {
      console.error('AI TTS failed', e);
      throw e;
    }
  },

  createWavFromPcm(base64Data: string, mimeType: string): Uint8Array {
    const binaryString = atob(base64Data);
    const dataLength = binaryString.length;
    
    let sampleRate = 24000;
    const rateMatch = mimeType.match(/rate=(\d+)/);
    if (rateMatch) sampleRate = parseInt(rateMatch[1], 10);

    const numChannels = 1;
    const bitsPerSample = 16;
    const byteRate = sampleRate * numChannels * bitsPerSample / 8;
    const blockAlign = numChannels * bitsPerSample / 8;

    const buffer = new Uint8Array(44 + dataLength);
    const view = new DataView(buffer.buffer);

    this.writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataLength, true);
    this.writeString(view, 8, 'WAVE');
    this.writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true);
    this.writeString(view, 36, 'data');
    view.setUint32(40, dataLength, true);

    // Standard copy without byte-swapping for now (most modern APIs return LE)
    for (let i = 0; i < dataLength; i++) {
      buffer[44 + i] = binaryString.charCodeAt(i);
    }

    return buffer;
  },

  writeString(view: DataView, offset: number, string: string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  },

  async callAI(prompt: string, config: AppConfig, type: 'data_gen' | 'tts' = 'data_gen'): Promise<any> {
    const ai = config.ai_config?.[type];
    if (!ai || !ai.endpoint) throw new Error(`AI configuration for ${type} is missing endpoint.`);

    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (ai.authType === "bearer") {
      headers["Authorization"] = `Bearer ${ai.apiKey}`;
    } else if (ai.authType === "x-api-key") {
      headers["x-api-key"] = ai.apiKey || "";
      headers["anthropic-version"] = "2023-06-01";
    } else if (ai.authType === "google") {
      headers["X-goog-api-key"] = ai.apiKey || "";
    }

    let body: any;
    const fullPrompt = `${SYSTEM_PROMPT}\n${prompt}`;
    const format = ai.format || (ai.endpoint.includes('generativelanguage.googleapis.com') ? 'gemini' : 'openai');

    switch (format) {
      case "openai":
        body = {
          model: ai.model || (type === 'tts' ? "gemini-2.5-flash-preview-tts" : "gemini-flash-lite-latest"),
          messages: [{ role: "system", content: SYSTEM_PROMPT }, { role: "user", content: prompt }],
          response_format: { type: "json_object" }
        };
        break;
      case "anthropic":
        body = {
          model: ai.model || "claude-3-haiku-20240307",
          max_tokens: 1000,
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content: prompt }],
        };
        break;
      case "gemini":
        body = {
          contents: [{ parts: [{ text: fullPrompt }] }],
          generation_config: { response_mime_type: "application/json" }
        };
        break;
      case "ollama":
        body = {
          model: ai.model || "llama3",
          prompt: fullPrompt,
          stream: false,
          format: "json"
        };
        break;
      default:
        throw new Error("Unsupported format");
    }

    const res = await fetch(ai.endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`AI error (${res.status}): ${err}`);
    }

    const data = await res.json();
    let text = "";
    switch (format) {
      case "gemini":
        text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
        break;
      case "anthropic":
        text = data?.content?.[0]?.text || "";
        break;
      case "openai":
        text = data?.choices?.[0]?.message?.content || "";
        break;
      case "ollama":
        text = data?.response || "";
        break;
      default:
        text = JSON.stringify(data);
    }

    if (!text) throw new Error('Empty AI response');
    return JSON.parse(text.replace(/```json\n?|```/g, '').trim());
  }
};
