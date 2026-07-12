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
  getSubtitles: (id: VideoId, cid: number) =>
    ipcRenderer.invoke("bili:getSubtitles", id, cid),
  getSubtitleLines: (url: string) => ipcRenderer.invoke("bili:getSubtitleLines", url),
  getChannelInfo: (mid: number) => ipcRenderer.invoke("bili:getChannelInfo", mid),
  getChannelVideos: (mid: number, page: number) =>
    ipcRenderer.invoke("bili:getChannelVideos", mid, page),
  searchVideos: (keyword: string, page: number) =>
    ipcRenderer.invoke("bili:searchVideos", keyword, page),
  searchUsers: (keyword: string, page: number) =>
    ipcRenderer.invoke("bili:searchUsers", keyword, page),
  loginQrStart: () => ipcRenderer.invoke("bili:loginQrStart"),
  loginQrPoll: (qrcodeKey: string) => ipcRenderer.invoke("bili:loginQrPoll", qrcodeKey),
  getLoginState: () => ipcRenderer.invoke("bili:getLoginState"),
  logout: () => ipcRenderer.invoke("bili:logout"),
};

contextBridge.exposeInMainWorld("bili", bili);
