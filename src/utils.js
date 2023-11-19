export const uidRegex = /\(\([^\)]{9}\)\)/g;
export const pageRegex = /\[\[.*\]\]/g; // very simplified, not recursive...

export function getTreeByUid(uid) {
  if (uid) {
    return window.roamAlphaAPI.pull(
      "[:block/uid :block/string :block/children {:block/children  ...} :block/open {:block/refs [:block/uid]} :block/order {:block/page [:block/uid]}]",
      [":block/uid", uid]
    );
  } else return null;
}

// Same function with .q
//
// export function getTreeByUid(uid) {
//   if (uid)
//     return window.roamAlphaAPI.q(`[:find (pull ?page
//                      [:block/uid :block/string :block/children :block/refs
//                         {:block/children ...} ])
//                       :where [?page :block/uid "${uid}"]  ]`)[0];
//   else return null;
// }

export function getBlockContentByUid(uid) {
  let result = window.roamAlphaAPI.pull("[:block/string]", [":block/uid", uid]);
  if (result) return result[":block/string"];
  else return "";
}

export async function getTopOrActiveBlockUid() {
  let currentBlockUid = window.roamAlphaAPI.ui.getFocusedBlock()?.["block-uid"];
  if (currentBlockUid) return currentBlockUid;
  else {
    let uid = await window.roamAlphaAPI.ui.mainWindow.getOpenPageOrBlockUid();
    return getFirstChildUid(uid);
  }
}

function getFirstChildUid(uid) {
  let q = `[:find (pull ?c
                       [:block/uid :block/children {:block/children ...}])
                    :where [?c :block/uid "${uid}"]  ]`;
  return window.roamAlphaAPI.q(q)[0][0].children[0].uid;
}

export function processNotesInTree(tree, callback, callbackArgs) {
  //  tree = tree.sort((a, b) => a.order - b.order);
  for (let i = 0; i < tree.length; i++) {
    let content = tree[i].string;
    callback(callbackArgs);
    let subTree = tree[i].children;
    if (subTree) {
      processNotesInTree(subTree, callback);
    }
  }
}

export function insertBlock(startUid, content) {
  // let parentUid = window.roamAlphaAPI.util.generateUID();
  if (!startUid) {
    startUid = "UB-lqJO6r";
    window.roamAlphaAPI.createBlock({
      location: { "parent-uid": startUid, order: 0 },
      block: {
        string: content,
      },
    });
    return;
  }
  window.roamAlphaAPI.updateBlock({
    block: { uid: startUid, string: content },
  });
}
