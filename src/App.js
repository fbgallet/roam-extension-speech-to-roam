import React, { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import {
  faMicrophone,
  faRecordVinyl,
  faDownload,
  faBackwardStep,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
//import "./App.css";
import { getMediaRecorderStream } from "./audio";
import { transcribeAudio } from "./openai";
import { insertBlock } from "./utils";
import { Timer } from "./components/timer";

// Speech recognition settings
const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;
const mic = new SpeechRecognition();
mic.continuous = true;
mic.interimResults = true;
mic.lang = "fr-FR";
mic.maxAlternatives = 2;

function App(props) {
  const [isListening, setIsListening] = useState(false);
  const [note, setNote] = useState(null);
  const [time, setTime] = useState(0);

  const audioChunk = useRef([]);
  const [recording, setRecording] = useState(null);
  const mediaRecorderRef = useRef(null);

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

  const handleSaveNote = async () => {
    if (!recording) {
      setIsListening(false);
      setRecording(null);
      return;
    }
    setNote("");
    // Transcribe audio
    let transcribe = await transcribeAudio(recording);
    console.log("SpeechAPI: " + note);
    console.log("Whisper: " + transcribe);

    console.log("block uid:", props.blockUid);
    insertBlock(props.blockUid, transcribe);
    const node = document.getElementsByClassName("speech-to-roam-container")[0];
    ReactDOM.unmountComponentAtNode(node);
  };

  const handleBackward = () => {
    setTime(0);
    setRecording(undefined);
    setNote("");
    audioChunk.current = [];
  };

  return (
    <>
      {(isListening || recording !== null) && (
        <span class="bp3-popover-wrapper">
          <span aria-haspopup="true" class="bp3-popover-target">
            <span
              onClick={handleBackward}
              class="bp3-button bp3-minimal bp3-small speech-backward-button"
              tabindex="0"
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
      <span class="bp3-popover-wrapper">
        <span aria-haspopup="true" class="bp3-popover-target">
          {(isListening || recording !== null) && (
            <span
              onClick={handleSaveNote}
              disabled={!recording}
              class="bp3-button bp3-minimal bp3-small"
              tabindex="0"
            >
              <FontAwesomeIcon
                icon={faDownload}
                flip="horizontal"
                style={{ color: "#5c7080" }}
              />
            </span>
          )}
        </span>
      </span>
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
    </>
  );
}

export default App;
