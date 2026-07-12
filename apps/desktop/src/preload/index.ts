import { contextBridge, ipcRenderer } from "electron";
import type {
  BiliBridge,
  TranslateOptions,
  TranslatorSettings,
  VideoId,
} from "@bili/types";

const bili: BiliBridge = {
  resolveVideo: (url: string) => ipcRenderer.invoke("bili:resolveVideo", url),
  getStreams: (id: VideoId, cid: number) =>
    ipcRenderer.invoke("bili:getStreams", id, cid),
  getComments: (aid: number, offset: string | null) =>
    ipcRenderer.invoke("bili:getComments", aid, offset),
  getReplies: (aid: number, root: number, pn: number) =>
    ipcRenderer.invoke("bili:getReplies", aid, root, pn),
  translate: (texts: string[], opts?: TranslateOptions) =>
    ipcRenderer.invoke("bili:translate", texts, opts),
  getSettings: () => ipcRenderer.invoke("bili:getSettings"),
  setSettings: (s: TranslatorSettings) => ipcRenderer.invoke("bili:setSettings", s),
};

contextBridge.exposeInMainWorld("bili", bili);
