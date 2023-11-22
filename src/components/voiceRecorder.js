import React, { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import {
  faMicrophone,
  faRecordVinyl,
  faDownload,
  faBackwardStep,
  faWandMagicSparkles,
  faLanguage,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
//import "./App.css";
import { getMediaRecorderStream } from "../audio";
import { transcribeAudio, translateAudio } from "../openai";
import { addContentToBlock, insertBlockInCurrentView } from "../utils";
import { Timer } from "./timer";
import { OPENAI_API_KEY, isTranslateIconDisplayed, isUsingWhisper } from "..";

// Speech recognition settings
const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;
const mic = new SpeechRecognition();
mic.continuous = true;
mic.interimResults = true;
mic.lang = "fr-FR";
mic.maxAlternatives = 2;

function VoiceRecorder(props) {
  let { blockUid, startRecording, transcribeOnly, translateOnly } = props;
  const [isListening, setIsListening] = useState(startRecording ? true : false);
  const [currentBlock, setCurrentBlock] = useState(blockUid);
  const [isToDisplay, setIsToDisplay] = useState({
    transcribeIcon: !translateOnly,
    translateIcon: !transcribeOnly,
  });
  const [note, setNote] = useState(null);
  const [time, setTime] = useState(0);

  const audioChunk = useRef([]);
  const [recording, setRecording] = useState(null);
  const mediaRecorderRef = useRef(null);

  useEffect(() => {
    console.log("Voice recorder component mounted", props);
    // removeHotkeysListeners();
    // document.addEventListener("keypress", onHotkeysPressed);
  }, []);

  React.useEffect(() => {
    let interval = null;

    if (isListening) {
      interval = setInterval(() => {
        setTime((time) => time + 10);
      }, 10);
    } else {
      clearInterval(interval);
    }
    return () => {
      clearInterval(interval);
    };
  }, [isListening]);

  const startRec = async () => {
    console.log("Start to record");

    setCurrentBlock(window.roamAlphaAPI.ui.getFocusedBlock()?.["block-uid"]);

    mediaRecorderRef.current = await getMediaRecorderStream(audioChunk);
    mediaRecorderRef.current.start();

    mediaRecorderRef.current.onstop = (e) => {
      console.log("End to record");
      const audioBlob = new Blob(audioChunk.current);
      const audioFile = new File([audioBlob], "audio.ogg", {
        type: "audio/ogg; codecs=opus",
      });
      setRecording(audioFile);
    };
  };

  const stopRec = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "recording"
    ) {
      mediaRecorderRef.current.stop();
    }
  };

  // const onHotkeysPressed = (evt) => {
  //   if (evt.code === "Space") {
  //     console.log("space");
  //     console.log(isListening);
  //     if (isListening) (() => setIsListening((prevState) => !prevState))();
  //   } else if (evt.code === "Escape") {
  //     console.log("escape");
  //     if (isListening) handleBackward();
  //   } else if (evt.code === "Enter") {
  //     console.log("enter");
  //     if (isListening) handleSaveNote();
  //   }
  // };
  // const removeHotkeysListeners = () => {
  //   document.removeEventListener("keypress", onHotkeysPressed);
  // };

  useEffect(() => {
    handleListen();
  }, [isListening]);

  const handleListen = () => {
    // recognition
    if (isListening) {
      mic.start();
      mic.onend = () => {
        console.log("continue...");
        mic.start();
      };

      // record
      startRec();
    } else {
      // recognition
      mic.stop();
      mic.onend = () => {
        console.log("Stopped Mic on Click");
      };

      // record
      stopRec();
    }
    mic.onstart = () => {
      console.log("Mics on");
    };
    mic.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0])
        .map((result) => result.transcript)
        .join("");
      console.log(transcript);
      setNote(transcript);
      mic.onerror = (event) => {
        console.log(event.error);
      };
    };
  };

  const handleTranscribe = () => {
    voiceProcessing(transcribeAudio);
  };

  const handleTranslate = () => {
    voiceProcessing(translateAudio);
  };

  const voiceProcessing = async (openAIvoiceProcessing) => {
    if (!recording) {
      setIsListening(false);
      setRecording(null);
      return;
    }
    if (isListening) {
      setIsListening(false);
    }
    // Transcribe audio
    let transcribe = note
      ? isUsingWhisper && OPENAI_API_KEY
        ? await openAIvoiceProcessing(recording)
        : note
      : "Nothing has been recorded!";
    console.log("SpeechAPI: " + note);
    console.log("Whisper: " + transcribe);
    if (transcribe === null)
      transcribe =
        note + " (⚠️ native recognition, verify your Whisper API key)";
    setNote("");
    currentBlock
      ? addContentToBlock(currentBlock, transcribe)
      : insertBlockInCurrentView(transcribe);
    initialize();
    // const node = document.getElementsByClassName("speech-to-roam-container")[0];
    // ReactDOM.unmountComponentAtNode(node);
  };

  const handleBackward = () => {
    if (isListening) {
      setIsListening(false);
    }
    initialize(time ? false : true);
  };

  const initialize = (complete = true) => {
    setTime(0);
    setNote("");
    setRecording(complete ? null : undefined);
    if (complete)
      setIsToDisplay({
        transcribeIcon: true,
        translateIcon: isTranslateIconDisplayed || translateOnly,
      });
    audioChunk.current = [];
  };

  return (
    <>
      <span class="bp3-popover-wrapper">
        <span aria-haspopup="true" class="bp3-popover-target">
          <span
            onClick={() => setIsListening((prevState) => !prevState)}
            class="bp3-button bp3-minimal bp3-small speech-record-button"
            tabindex="0"
          >
            {isListening ? (
              <FontAwesomeIcon
                icon={faRecordVinyl}
                beatFade
                style={{ color: "#e00000" }}
              />
            ) : (
              <FontAwesomeIcon
                icon={faMicrophone}
                style={{
                  color: "#5c7080",
                }}
              />
            )}
          </span>
        </span>
      </span>
      {(isListening || recording !== null) && (
        <span class="bp3-popover-wrapper">
          <span aria-haspopup="true" class="bp3-popover-target">
            <span
              onClick={handleBackward}
              class="bp3-button bp3-minimal bp3-small speech-backward-button"
              tabindex="0"
              title="Transcribe Voice to Text"
            >
              <FontAwesomeIcon
                icon={faBackwardStep}
                style={{ color: "#5c7080" }}
              />
              <Timer time={time} />
            </span>
          </span>
        </span>
      )}
      {isToDisplay.transcribeIcon && (
        <span class="bp3-popover-wrapper">
          <span aria-haspopup="true" class="bp3-popover-target">
            {(isListening || recording !== null) && (
              <span
                onClick={handleTranscribe}
                disabled={!recording}
                class="bp3-button bp3-minimal bp3-small"
                tabindex="0"
              >
                <FontAwesomeIcon
                  icon={faWandMagicSparkles}
                  style={{ color: "#5c7080" }}
                />
              </span>
            )}
          </span>
        </span>
      )}{" "}
      {isToDisplay.translateIcon && (
        <span class="bp3-popover-wrapper">
          <span aria-haspopup="true" class="bp3-popover-target">
            {(isListening || recording !== null) && (
              <span
                onClick={handleTranslate}
                disabled={!recording}
                class="bp3-button bp3-minimal bp3-small"
                tabindex="0"
              >
                <FontAwesomeIcon
                  icon={faLanguage}
                  flip="horizontal"
                  style={{ color: "#5c7080" }}
                />
              </span>
            )}
          </span>
        </span>
      )}
    </>
  );
}

export default VoiceRecorder;
