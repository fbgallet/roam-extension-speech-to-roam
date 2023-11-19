import createObserver from "roamjs-components/dom/createObserver";

const NEW_ELEMENT_ID = "xxxxxxx";

// store observers globally so they can be disconnected
var runners = {
  menuItems: [],
  observers: [],
};

function addObserver() {
  const autocompleteObserver = createObserver(setObserver);
  // save observers globally so they can be disconnected later
  runners["observers"] = [autocompleteObserver];
}
function disconnectObserver() {
  // loop through observers and disconnect
  for (let index = 0; index < runners["observers"].length; index++) {
    const element = runners["observers"][index];
    element.disconnect();
  }
}

function setObserver() {
  if (
    document.getElementsByClassName("rm-autocomplete__results") &&
    !document.getElementById(NEW_ELEMENT_ID)
  ) {
    const blockAutocomplete = document.getElementsByClassName(
      "rm-autocomplete__results"
    )[0];
    if (blockAutocomplete) {
      // let uid = window.roamAlphaAPI.ui.getFocusedBlock()?.["block-uid"];
      // noteInline = getInlineNote();
      // if (noteInline.content.length > 0) {
      //   let hasCreateNoteItem =
      //     blockAutocomplete.querySelector(".create-footnote");
      //   if (hasCreateNoteItem === null) {
      //     footnoteButton = blockAutocomplete.insertAdjacentElement(
      //       "afterbegin",
      //       createFootnoteButton(noteInline.content)
      //     );
      //   } else {
      //     blockAutocomplete.removeChild(footnoteButton);
      //     footnoteButton = blockAutocomplete.insertAdjacentElement(
      //       "afterbegin",
      //       createFootnoteButton(noteInline.content)
      //     );
      //   }
      //   let addAsBlockElt = footnoteButton.nextElementSibling;
      //   document.addEventListener(
      //     "keydown",
      //     function (e) {
      //       keyboardSelect(e, uid, addAsBlockElt);
      //     },
      //     { once: true }
      //   );
      //   footnoteButton.addEventListener(
      //     "click",
      //     function () {
      //       insertFootNote(uid);
      //     },
      //     { once: true }
      //   );
      // }
    }
  }
}
