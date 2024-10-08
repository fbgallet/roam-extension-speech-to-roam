import { chatRoles, isUsingWhisper } from "..";
import {
  copyTemplate,
  getTemplateForPostProcessing,
  insertCompletion,
  isPromptInConversation,
  lastCompletion,
} from "../ai/aiCommands";
import {
  contextAsPrompt,
  specificContentPromptBeforeTemplate,
} from "../ai/prompts";
import {
  mountComponent,
  simulateClickOnRecordingButton,
  toggleComponentVisibility,
  unmountComponent,
} from "./domElts";
import {
  addContentToBlock,
  createChildBlock,
  createSiblingBlock,
  getAndNormalizeContext,
  getBlockContentByUid,
  getFirstChildUid,
  getFlattenedContentFromArrayOfBlocks,
  getFocusAndSelection,
  getParentBlock,
  getResolvedContentFromBlocks,
  getRoamContextFromPrompt,
  getTemplateFromPrompt,
  insertBlockInCurrentView,
  resolveReferences,
  updateArrayOfBlocks,
} from "./utils";

export const loadRoamExtensionCommands = (extensionAPI) => {
  extensionAPI.ui.commandPalette.addCommand({
    label: "Live AI Assistant: Start/Pause recording your vocal note",
    callback: () => {
      simulateClickOnRecordingButton();
    },
  });
  extensionAPI.ui.commandPalette.addCommand({
    label: `Live AI Assistant: Transcribe your vocal note${
      isUsingWhisper ? " with Whisper" : ""
    }`,
    callback: () => {
      const button = document.getElementsByClassName("speech-transcribe")[0];
      if (button) {
        button.focus();
        button.click();
        if (
          !isComponentVisible &&
          document.getElementsByClassName("speech-to-roam")[0]?.style
            .display !== "none"
        )
          toggleComponentVisibility();
      } else simulateClickOnRecordingButton();
    },
  });
  extensionAPI.ui.commandPalette.addCommand({
    label: "Live AI Assistant: Translate to English",
    callback: () => {
      const button = document.getElementsByClassName("speech-translate")[0];
      if (button) {
        button.focus();
        button.click();
        if (
          !isComponentVisible &&
          document.getElementsByClassName("speech-to-roam")[0]?.style
            .display !== "none"
        )
          toggleComponentVisibility();
      } else simulateClickOnRecordingButton();
    },
  });
  extensionAPI.ui.commandPalette.addCommand({
    label: "Live AI Assistant: Transcribe & send as prompt to AI assistant",
    callback: () => {
      const button = document.getElementsByClassName("speech-completion")[0];
      if (button) {
        button.focus();
        button.click();
        if (
          !isComponentVisible &&
          document.getElementsByClassName("speech-to-roam")[0]?.style
            .display !== "none"
        )
          toggleComponentVisibility();
      } else simulateClickOnRecordingButton();
    },
  });

  extensionAPI.ui.commandPalette.addCommand({
    label:
      "Live AI Assistant: Transcribe & send as content for templated-based AI post-processing",
    callback: () => {
      const button = document.getElementsByClassName(
        "speech-post-processing"
      )[0];
      if (button) {
        button.focus();
        button.click();
        if (
          !isComponentVisible &&
          document.getElementsByClassName("speech-to-roam")[0]?.style
            .display !== "none"
        )
          toggleComponentVisibility();
      } else simulateClickOnRecordingButton();
    },
  });

  extensionAPI.ui.commandPalette.addCommand({
    label:
      "Live AI Assistant: Toggle visibility of the button (not permanently)",
    callback: () => {
      isComponentVisible = !isComponentVisible;
      unmountComponent(position);
      mountComponent(position);
      toggleComponentVisibility();
    },
  });

  extensionAPI.ui.commandPalette.addCommand({
    label:
      "Live AI Assistant: (text) AI completion of focused block as prompt & selection as context",
    callback: async () => {
      let prompt, targetUid;
      let { currentUid, currentBlockContent, selectionUids } =
        getFocusAndSelection();
      if (!currentUid && !selectionUids.length) return;

      const isInConversation = currentUid
        ? isPromptInConversation(currentUid)
        : false;
      if (
        !currentUid &&
        selectionUids.length &&
        document.querySelector(".block-highlight-blue")
      ) {
        targetUid = await createSiblingBlock(selectionUids[0]);
        await addContentToBlock(targetUid, chatRoles.assistant);
        prompt = getResolvedContentFromBlocks(selectionUids, false);
        selectionUids = [];
      } else {
        targetUid = currentUid
          ? await createChildBlock(
              isInConversation ? getParentBlock(currentUid) : currentUid,
              chatRoles.assistant
            )
          : await insertBlockInCurrentView(
              chatRoles.user + " a selection of blocks"
            );
        prompt = currentBlockContent ? currentBlockContent : contextAsPrompt;
      }

      const inlineContext = currentBlockContent
        ? getRoamContextFromPrompt(currentBlockContent)
        : null;
      if (inlineContext) prompt = inlineContext.updatedPrompt;
      console.log("inlineContext :>> ", inlineContext);

      let context = await getAndNormalizeContext(
        // currentUid && selectionUids.length ? null : currentUid,
        null,
        selectionUids,
        inlineContext?.roamContext,
        currentUid
      );
      insertCompletion({
        prompt,
        targetUid,
        context,
        typeOfCompletion: "gptCompletion",
        isInConversation,
      });
    },
  });

  extensionAPI.ui.commandPalette.addCommand({
    label:
      "Live AI Assistant: (text) template-based AI post-processing, children as prompt template & focused block as content",
    callback: async () => {
      let { currentUid, currentBlockContent, selectionUids } =
        getFocusAndSelection();
      if (!currentUid) {
        if (selectionUids.length) currentUid = selectionUids[0];
        else return;
      }

      const inlineContext = getRoamContextFromPrompt(currentBlockContent);
      if (inlineContext) currentBlockContent = inlineContext.updatedPrompt;
      let context = await getAndNormalizeContext(
        null,
        selectionUids,
        inlineContext?.roamContext
      );

      // simulateClick(document.querySelector(".roam-body-main"));
      let targetUid;
      let waitForBlockCopy = false;
      if (currentBlockContent) {
        let inlineTemplate = getTemplateFromPrompt(
          getBlockContentByUid(currentUid)
        );
        // console.log("inlineTemplate :>> ", inlineTemplate);
        if (inlineTemplate) {
          await copyTemplate(currentUid, inlineTemplate.templateUid);
          currentBlockContent = resolveReferences(inlineTemplate.updatedPrompt);
          waitForBlockCopy = true;
        } else {
          targetUid = getFirstChildUid(currentUid);
          if (!targetUid) {
            await copyTemplate(currentUid);
            waitForBlockCopy = true;
          }
        }
      }
      setTimeout(
        async () => {
          let template = await getTemplateForPostProcessing(currentUid);
          if (!template.isInMultipleBlocks) {
            targetUid = await createChildBlock(
              targetUid ? targetUid : currentUid,
              chatRoles.assistant,
              inlineContext?.roamContext
            );
            currentUid = targetUid;
          }
          let prompt = template.isInMultipleBlocks
            ? specificContentPromptBeforeTemplate +
              currentBlockContent +
              "\n\n" +
              template.stringified
            : template.stringified;

          if (!targetUid) targetUid = getFirstChildUid(currentUid);

          insertCompletion({
            prompt,
            // waitForBlockCopy ? currentUid : targetUid,
            targetUid,
            context,
            typeOfCompletion: template.isInMultipleBlocks
              ? "gptPostProcessing"
              : "gptCompletion",
          });
        },
        waitForBlockCopy ? 100 : 0
      );
    },
  });

  extensionAPI.ui.commandPalette.addCommand({
    label: "Live AI Assistant: Redo last AI completion (update response)",
    callback: () => {
      if (lastCompletion.prompt) {
        const focusUid =
          window.roamAlphaAPI.ui.getFocusedBlock()?.["block-uid"];
        const targetUid = focusUid ? focusUid : lastCompletion.targetUid;
        console.log("lastCompletion :>> ", lastCompletion);
        insertCompletion({
          prompt: lastCompletion.prompt,
          targetUid,
          context: lastCompletion.context,
          typeOfCompletion: lastCompletion.typeOfCompletion,
          instantModel: lastCompletion.instantModel,
          isRedone: true,
        });
      }
    },
  });

  // Add SmartBlock command
  const insertCmd = {
    text: "SPEECHTOROAM",
    help: "Start recording a vocal note using Speech-to-Roam extension",
    handler: (context) => () => {
      simulateClickOnRecordingButton();
      return [""];
    },
  };
  if (window.roamjs?.extension?.smartblocks) {
    window.roamjs.extension.smartblocks.registerCommand(insertCmd);
  } else {
    document.body.addEventListener(`roamjs:smartblocks:loaded`, () => {
      window.roamjs?.extension.smartblocks &&
        window.roamjs.extension.smartblocks.registerCommand(insertCmd);
    });
  }
};
