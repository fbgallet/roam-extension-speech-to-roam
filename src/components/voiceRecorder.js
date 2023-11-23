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
import { getMediaRecorderStream, getSpeechRecognitionAPI } from "../audio";
import { transcribeAudio, translateAudio } from "../openai";
import { addContentToBlock, insertBlockInCurrentView } from "../utils";
import { Timer } from "./timer";
import { OPENAI_API_KEY, isTranslateIconDisplayed, isUsingWhisper } from "..";

function VoiceRecorder(props) {
  let { blockUid, startRecording, transcribeOnly, translateOnly, mic } = props;
  const [isListening, setIsListening] = useState(startRecording ? true : false);
  const [currentBlock, setCurrentBlock] = useState(blockUid);
  const [isToDisplay, setIsToDisplay] = useState({
    transcribeIcon: !translateOnly,
    translateIcon: !transcribeOnly,
  });
  const [instantVoiceReco, setinstantVoiceReco] = useState(null);
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

    mediaRecorderRef.current.onstop = async (e) => {
      console.log("End to record");
      const audioBlob = new Blob(audioChunk.current);
      const audioFile = new File([audioBlob], "audio.ogg", {
        type: "audio/ogg; codecs=opus",
      });
      setRecording(audioFile);
    };
  };

  const stopRec = async () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "recording"
    ) {
      await mediaRecorderRef.current.stop();
    }
  };

  useEffect(() => {
    handleListen();
  }, [isListening]);

  const handleListen = async () => {
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
      await stopRec();
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
      setinstantVoiceReco(transcript);
      mic.onerror = (event) => {
        console.log(event.error);
      };
    };
  };

  const handleTranscribe = () => {
    voiceProcessing(transcribeAudio);
  };

  const handleTranslate = async () => {
    await voiceProcessing(translateAudio);
  };

  const voiceProcessing = async (openAIvoiceProcessing) => {
    if (isListening) {
      setIsListening((prevState) => !prevState);
    }
    if (!recording) {
      setIsListening(false);
      setRecording(null);
      return;
    }
    // Transcribe audio
    let transcribe = instantVoiceReco
      ? isUsingWhisper && OPENAI_API_KEY
        ? await openAIvoiceProcessing(recording)
        : instantVoiceReco
      : "Nothing has been recorded!";
    // console.log("SpeechAPI: " + instantVoiceReco);
    // console.log("Whisper: " + transcribe);
    if (transcribe === null)
      transcribe =
        instantVoiceReco +
        " (⚠️ native recognition, verify your Whisper API key)";
    setinstantVoiceReco("");
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
    setinstantVoiceReco("");
    setRecording(complete ? null : undefined);
    if (complete)
      setIsToDisplay({
        transcribeIcon: true,
        translateIcon: isTranslateIconDisplayed || translateOnly,
      });
    audioChunk.current = [];
  };

  const handleKeys = async (e) => {
    if (e.code === "Escape") {
      handleBackward();
    }
    if (e.code === "Space") {
      setIsListening((prevState) => !prevState);
    }
    if (e.code === "Enter") {
      if (!translateOnly) {
        handleTranscribe();
      }
    }
  };

  return (
    <>
      <span class="bp3-popover-wrapper">
        <span aria-haspopup="true" class="bp3-popover-target">
          <span
            onKeyDown={handleKeys}
            onClick={() => setIsListening((prevState) => !prevState)}
            class="bp3-button bp3-minimal bp3-small speech-record-button"
            tabindex="0"
            title={
              isListening
                ? "Stop/Pause voice recording"
                : "Start/Resume voice recording"
            }
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
              title="Rewind and delete the current recording."
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
                title="Transcribe Voice to Text"
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
                title="Translate Voice to English text"
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
