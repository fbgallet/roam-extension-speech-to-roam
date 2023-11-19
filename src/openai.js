import OpenAI from "openai";
import { OPENAI_API_KEY } from ".";

let openai;

export function initializeOpenAIAPI() {
  try {
    openai = new OpenAI({
      apiKey: OPENAI_API_KEY,
      dangerouslyAllowBrowser: true,
    });
  } catch (error) {
    console.log(error.message);
  }
}

export async function transcribeAudio(filename) {
  // let audioFile = new File([filename], "myaudio.ogg", {
  //   type: "audio/ogg; codecs=opus",
  // });
  console.log(filename);
  try {
    console.log(filename);
    const transcript = await openai.audio.transcriptions.create({
      file: filename,
      model: "whisper-1",
      language: "fr",
      // prompt:
      //   "Ecrire correctement ces noms propres: Leonardo DiCaprio, Brad Pitt, Johnny Depp, Robert Downey Jr., Will Smith, Tom Hanks, Morgan Freeman, Samuel L. Jackson",
    });
    return transcript.text;
    // let processed = await gptPostProcessing(transcript.text);
    // return processed;
  } catch (error) {
    console.error(error);
  }
}

export async function gptPostProcessing(text) {
  console.log("text: ", text);
  try {
    const postProcessedText = await openai.completions.create({
      model: "gpt-3.5-turbo-instruct",
      prompt:
        text +
        "\nTu es un expert en prise de notes. Reproduis exactement le texte précédent, en mettant entre crochets les mots les plus importants.",
      max_tokens: Math.floor(text.length / 2),
      temperature: 0.1,
    });
    console.log(postProcessedText.choices[0]);
    return postProcessedText.choices[0].text;
  } catch (error) {
    console.error(error);
  }
}
