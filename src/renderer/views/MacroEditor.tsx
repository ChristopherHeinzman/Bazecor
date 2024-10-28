/* eslint-disable no-bitwise */
/* Bazecor -- Kaleidoscope Command Center
 * Copyright (C) 2018, 2019  Keyboardio, Inc.
 * Copyright (C) 2019  DygmaLab SE
 *
 * This program is free software: you can redistribute it and/or modify it under
 * the terms of the GNU General Public License as published by the Free Software
 * Foundation, version 3.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import React, { useEffect, useState, useRef } from "react";
import { toast } from "react-toastify";
import Styled from "styled-components";
import log from "electron-log/renderer";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@Renderer/components/atoms/Select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@Renderer/components/atoms/Dialog";

// Types
import {
  ListToDeleteMType,
  ListToDeleteSType,
  ListToDeleteType,
  MacroEditorInitialStateType,
  MacroEditorProps,
} from "@Renderer/types/macroEditor";
import { Neuron } from "@Renderer/types/neurons";
import { KeymapType } from "@Renderer/types/layout";
import { SuperkeysType } from "@Renderer/types/superkeys";
import { MacroActionsType, MacrosType } from "@Renderer/types/macros";

// Components
import LogoLoader from "@Renderer/components/atoms/loader/LogoLoader";
import { Button } from "@Renderer/components/atoms/Button";
import { IconFloppyDisk, IconLoader } from "@Renderer/components/atoms/icons";
import MacroSelector from "@Renderer/components/organisms/Select/MacroSelector";
import ToastMessage from "@Renderer/components/atoms/ToastMessage";
import Callout from "@Renderer/components/molecules/Callout/Callout";
import Heading from "@Renderer/components/atoms/Heading";

// Modules
import { PageHeader } from "@Renderer/modules/PageHeader";
import MacroCreator from "@Renderer/modules/Macros/MacroCreator";
import TimelineEditorManager from "@Renderer/modules/Macros/TimelineEditorManager";

// Tools
import { useDevice } from "@Renderer/DeviceContext";
import { i18n } from "@Renderer/i18n";
import Backup from "../../api/backup";
import Keymap, { KeymapDB } from "../../api/keymap";

import Store from "../utils/Store";
import getLanguage from "../utils/language";

const store = Store.getStore();

const Styles = Styled.div`
  .toggle-button{
    text-align: center;
    padding-bottom: 8px;
  }
  .list-group-item {
    border: none !important;
    background-color: ${({ theme }) => theme.card.background};
  }
  .save-button {
    text-align: center;
  }
  .macrocontainer {
    margin-right: auto;
    margin-left: auto;
    /* width: inherit; */
    max-width: 1350px;
  }
  .save-row {
    position: absolute;
    right: 30px;
    top: 65px;
  }
  .button-large {
    font-size: 2rem;
    width: -webkit-fill-available;
    text-align: left;
  }
  .cancel-active{
    background-color: ${({ theme }) => theme.colors.button.cancel};
  }
  .save-active{
    background-color: ${({ theme }) => theme.colors.button.save};
  }
  .button-large:not(:disabled):not(.disabled):hover {
    color: ${({ theme }) => theme.colors.button.text};
    background-color: ${({ theme }) => theme.colors.button.active};
    border: none;
  }
`;

function MacroEditor(props: MacroEditorProps) {
  let keymapDB = new KeymapDB();
  const bkp = new Backup();
  const [isSaving, setIsSaving] = useState(false);

  const flatten = (arr: unknown[]) => [].concat(...arr);

  const initialState: MacroEditorInitialStateType = {
    keymap: undefined,
    macros: [],
    superkeys: [],
    storedMacros: [],
    neurons: [],
    neuronIdx: 0,
    maxMacros: 128,
    modified: false,
    selectedMacro: 0,
    showDeleteModal: false,
    listToDelete: [],
    listToDeleteS: [],
    listToDeleteM: [],
    futureMacros: [],
    selectedList: -1,
    usedMemory: 0,
    totalMemory: 0,
    macrosEraser: "",
    loading: true,
    currentLanguageLayout: getLanguage(store.get("settings.language") as string),
    kbtype: "ansi",
    scrollPos: 0,
  };
  const [state, setState] = useState(initialState);
  const { state: deviceState } = useDevice();
  const timelineRef = useRef(null);

  const superTranslator = (raw: string) => {
    const { neurons, neuronIdx } = state;
    const superArray = raw.split(" 0 0")[0].split(" ").map(Number);

    let skAction: number[] = [];
    const superkeys: SuperkeysType[] = [];
    let iter = 0;
    let superindex = 0;

    if (superArray.length < 1) {
      log.info("Discarded Superkeys due to short length of string", raw, raw.length);
      return [{ actions: [53, 2101, 1077, 41, 0], name: "Welcome to superkeys", id: superindex }];
    }
    while (superArray.length > iter) {
      // log.info(iter, raw[iter], superkey);
      if (superArray[iter] === 0) {
        superkeys[superindex] = { actions: skAction, name: "", id: superindex };
        superindex += 1;
        skAction = [];
      } else {
        skAction.push(superArray[iter]);
      }
      iter += 1;
    }
    superkeys[superindex] = { actions: skAction, name: "", id: superindex };

    if (superkeys[0].actions.length === 0 || superkeys[0].actions.length > 5) {
      log.info(`Superkeys were empty`);
      return [];
    }
    log.info(`Got Superkeys:${JSON.stringify(superkeys)} from ${raw}`);
    // TODO: Check if stored superKeys match the received ones, if they match, retrieve name and apply it to current superKeys
    let finalSuper: SuperkeysType[] = [];
    const stored = neurons[neuronIdx].superkeys;
    finalSuper = superkeys.map((superky, i) => {
      const superk = superky;
      superk.id = i;
      if (stored.length > i && stored.length > 0) {
        const aux = superk;
        aux.name = stored[i].name;
        return aux;
      }
      return superk;
    });
    log.info("final superkeys", finalSuper);
    return finalSuper;
  };

  const superkeyMap = (superkeys: SuperkeysType[]) => {
    if (
      superkeys.length === 0 ||
      (superkeys.length === 1 && superkeys[0].actions.length === 0) ||
      (superkeys.length === 1 && superkeys[0].actions.length === 1 && superkeys[0].actions[0] === 0)
    ) {
      return Array(512).fill("65535").join(" ");
    }
    let keyMap = JSON.parse(JSON.stringify(superkeys));
    // log.info("First", JSON.stringify(keyMap));
    keyMap = keyMap.map((sky: SuperkeysType) => {
      const sk = sky;
      sk.actions = sk.actions.map(act => {
        if (act === 0 || act === null || act === undefined) return 1;
        return act;
      });
      if (sk.actions.length < 5) sk.actions = sk.actions.concat(Array(5 - sk.actions.length).fill(1));
      return sk;
    });
    const mapped = keyMap
      .map((superkey: SuperkeysType) => superkey.actions.filter(act => act !== 0).concat([0]))
      .flat()
      .concat([0])
      .join(" ")
      .split(",")
      .join(" ");
    log.info("Mapped superkeys: ", mapped, keyMap);
    return mapped;
  };

  const macrosMap = (macros: MacrosType[]) => {
    const { macrosEraser } = state;
    log.info(
      "Macros map function",
      macros,
      macrosEraser,
      macros.length === 0,
      macros.length === 1 && Array.isArray(macros[0].actions),
    );
    if (macros.length === 0 || (macros.length === 1 && !Array.isArray(macros[0].actions))) {
      return macrosEraser;
    }
    const mapAction = (action: MacroActionsType): number[] => {
      switch (action.type) {
        case 1:
          return [
            action.type,
            (action.keyCode as number[])[0] >> 8,
            (action.keyCode as number[])[0] & 255,
            (action.keyCode as number[])[1] >> 8,
            (action.keyCode as number[])[1] & 255,
          ];
        case 2:
        case 3:
        case 4:
        case 5:
          return [action.type, (action.keyCode as number) >> 8, (action.keyCode as number) & 255];
        default:
          return [action.type, action.keyCode as number];
      }
    };
    const result: string = macros
      .map(macro => macro.actions.map((action: MacroActionsType) => mapAction(action)).concat([0]))
      .flat()
      .concat([0])
      .join(" ")
      .split(",")
      .join(" ");
    log.info("MACROS GOING TO BE SAVED", result);
    return result;
  };

  const addToActions = (actions: MacroActionsType[]) => {
    const { startContext } = props;
    const { macros, selectedMacro } = state;

    const macrosList: MacrosType[] = JSON.parse(JSON.stringify(macros));
    macrosList[selectedMacro].actions = macrosList[selectedMacro].actions.concat(actions);
    state.macros = macrosList;
    state.modified = true;
    setState({ ...state });
    startContext();
  };

  // Define updateActions function to update the actions of the selected macro
  const updateActions = (actions: MacroActionsType[]) => {
    const { startContext } = props;
    const { macros, selectedMacro, modified } = state;

    const macrosList = macros;
    macrosList[selectedMacro].actions = actions;
    if (!modified) {
      state.macros = macrosList;
      state.modified = true;
      setState({ ...state });
      startContext();
    } else {
      state.macros = macrosList;
      setState({ ...state });
    }
  };

  const saveName = (data: string) => {
    const { startContext } = props;
    const { macros, selectedMacro } = state;
    const localMacros = [...macros];
    localMacros[selectedMacro].name = data;
    state.macros = localMacros;
    state.modified = true;
    setState({ ...state });
    startContext();
  };

  const updateScroll = (scrollPos: number) => {
    state.scrollPos = scrollPos;
    setState({ ...state });
  };

  const changeSelected = (id: number) => {
    state.selectedMacro = id < 0 ? 0 : id;
    setState({ ...state });
  };

  const updateMacros = (recievedMacros: MacrosType[]) => {
    const { startContext } = props;
    state.macros = recievedMacros;
    state.modified = true;
    state.usedMemory = recievedMacros.map(m => m.actions).flat().length;
    setState({ ...state });
    startContext();
  };

  const duplicateMacro = () => {
    const { macros, maxMacros, selectedMacro } = state;
    if (macros.length >= maxMacros) {
      return;
    }
    const selected = selectedMacro;
    const aux = { ...macros[selected] };
    aux.id = macros.length;
    aux.name = `Copy of ${aux.name}`;
    macros.push(aux);
    updateMacros(macros);
    changeSelected(aux.id);
  };

  const writeMacros = async () => {
    const { macros, neurons, neuronIdx, keymap, superkeys } = state;
    const { setLoading, cancelContext } = props;
    const { currentDevice } = deviceState;
    setIsSaving(true);
    setLoading(true);
    log.info("saving Macros:", macros, keymap, superkeys);
    const newMacros = macros;
    const localNeurons = [...neurons];
    localNeurons[neuronIdx].macros = newMacros;
    store.set("neurons", localNeurons);
    try {
      await currentDevice.command("macros.map", macrosMap(newMacros));
      const args = flatten(keymap.custom).map(k => keymapDB.serialize(k).toString());
      await currentDevice.command("keymap.custom", ...args);
      await currentDevice.command("superkeys.map", superkeyMap(superkeys));
      const commands = await Backup.Commands(currentDevice);
      const backup = await bkp.DoBackup(commands, neurons[neuronIdx].id, currentDevice);
      Backup.SaveBackup(backup, currentDevice);
      toast.success(<ToastMessage title={i18n.editor.macros.successFlashTitle} content="" icon={<IconFloppyDisk />} />, {
        autoClose: 2000,
        icon: "",
      });
      state.modified = false;
      state.macros = newMacros;
      state.storedMacros = newMacros;
      setState({ ...state });
      cancelContext();
      setLoading(false);
      setIsSaving(false);
    } catch (error) {
      log.info("error when writing macros");
      log.error(error);
      toast.error(<ToastMessage title="Error when sending macros to the device" icon={<IconFloppyDisk />} />, { icon: "" });
      cancelContext();
      setLoading(false);
      setIsSaving(false);
    }
  };

  const toggleDeleteModal = () => {
    state.showDeleteModal = false;
    state.futureMacros = [];
    state.listToDelete = [];
    state.listToDeleteS = [];
    state.listToDeleteM = [];
    setState({ ...state });
  };

  function ActUponDelete(localstate?: MacroEditorInitialStateType) {
    const { selectedList, listToDelete, listToDeleteS, listToDeleteM, keymap, superkeys } = state;
    const { startContext } = props;
    let macros = localstate ? localstate.futureMacros : state.futureMacros;
    log.info("Checking list to delete macros", listToDeleteM, macros);
    for (let i = 0; i < listToDelete.length; i += 1) {
      if (listToDelete[i].newKey === -1) {
        keymap.custom[listToDelete[i].layer][listToDelete[i].pos] = keymapDB.parse(
          selectedList === -1 ? 0 : selectedList + 53852,
        );
      } else {
        keymap.custom[listToDelete[i].layer][listToDelete[i].pos] = keymapDB.parse(listToDelete[i].newKey + 53852);
      }
    }
    for (let i = 0; i < listToDeleteS.length; i += 1) {
      if (listToDeleteS[i].newKey === -1) {
        superkeys[listToDeleteS[i].superIdx].actions[listToDeleteS[i].pos] = selectedList === -1 ? 1 : selectedList + 53852;
      } else {
        superkeys[listToDeleteS[i].superIdx].actions[listToDeleteS[i].pos] = listToDeleteS[i].newKey + 53852;
      }
    }
    for (let i = 0; i < listToDeleteM.length; i += 1) {
      if (listToDeleteM[i].newKey === -1) {
        if (selectedList === -1) {
          macros[listToDeleteM[i].macroIdx].actions[listToDeleteM[i].pos] = undefined;
        } else {
          macros[listToDeleteM[i].macroIdx].actions[listToDeleteM[i].pos].keyCode = selectedList + 53852;
        }
      } else {
        macros[listToDeleteM[i].macroIdx].actions[listToDeleteM[i].pos].keyCode = listToDeleteM[i].newKey + 53852;
      }
    }
    macros = macros.map(macro => {
      const newMacro = { ...macro };
      newMacro.actions = macro.actions.filter(x => x !== undefined);
      return newMacro;
    });
    macros = macros.map((macro, idx) => {
      const item = { ...macro };
      item.id = idx;
      return item;
    });
    log.info("result!", macros);
    state.keymap = keymap;
    state.superkeys = superkeys;
    state.macros = macros;
    state.modified = true;
    setState({ ...state });
    startContext();
    toggleDeleteModal();
  }

  const UpdateList = (data: string) => {
    state.selectedList = parseInt(data, 10);
    setState({ ...state });
  };

  function updateKeyboard(keyboardIdx: number, localMacros: MacrosType[]) {
    const { macros, superkeys, keymap } = state;
    let customKeymapList: ListToDeleteType[] = [];
    let customSuperList: ListToDeleteSType[] = [];
    let customMacrosList: ListToDeleteMType[] = [];
    for (let i = keyboardIdx; i < macros.length; i += 1) {
      const macroID = macros[i].id + 53852;
      const newKey = i === keyboardIdx ? -1 : i - 1;
      const filteredKeys = keymap.custom
        ? keymap.custom
            .map((layer, layerIdx) =>
              layer.map((key, pos) => ({ layer: layerIdx, key, pos, newKey })).filter(elem => elem.key.keyCode === macroID),
            )
            .flat()
        : [];
      const superkeyList = superkeys
        ? superkeys
            .map((supers, superIdx) =>
              supers.actions.map((action, pos) => ({ superIdx, pos, newKey, action })).filter(elem => elem.action === macroID),
            )
            .flat()
        : [];
      const macrosList = macros
        .map((macro, macroIdx) =>
          macro.actions
            .map((action, pos) => ({ macroIdx: macroIdx - 1, pos, newKey, actions: macro.actions }))
            .filter(elem => elem.actions[elem.pos].keyCode === macroID),
        )
        .flat();
      customKeymapList = [...filteredKeys];
      customSuperList = customSuperList.concat(superkeyList);
      customMacrosList = customMacrosList.concat(macrosList);
    }

    log.info("result of macro exploration: ", macros, customKeymapList, customSuperList, customMacrosList);

    state.futureMacros = localMacros;
    state.listToDelete = customKeymapList;
    state.listToDeleteS = customSuperList;
    state.listToDeleteM = customMacrosList;
    state.showDeleteModal =
      customKeymapList.filter(c => c.newKey === -1).length > 0 || customSuperList.length > 0 || customMacrosList.length > 0;
    setState({ ...state });

    if (!state.showDeleteModal) ActUponDelete(state);
    if (keyboardIdx >= macros.length - 1) {
      changeSelected(macros.length - 2);
    }
  }

  const deleteMacro = () => {
    const { macros, selectedMacro } = state;
    if (macros.length === 0) {
      return;
    }
    const selected = selectedMacro;
    let localMacros: MacrosType[] = JSON.parse(JSON.stringify(macros));
    localMacros.splice(selected, 1);
    localMacros = localMacros.map((macro, idx) => {
      const item = { ...macro };
      item.id = idx;
      return item;
    });
    updateKeyboard(selected, localMacros);
  };

  const addMacro = (name: string) => {
    const { macros, maxMacros } = state;
    if (macros.length >= maxMacros) {
      return;
    }
    const aux = macros;
    const newID = aux.length;
    aux.push({
      actions: [],
      name,
      id: newID,
      macro: "",
    });
    updateMacros(aux);
    changeSelected(newID);
  };

  const clearMacro = () => {
    const { macros, selectedMacro } = state;
    if (macros.length === 0) {
      return;
    }
    const localMacros = JSON.parse(JSON.stringify(macros)) as MacrosType[];
    localMacros[selectedMacro].actions = [];
    updateMacros(localMacros);
  };

  const macroTranslator = (raw: string) => {
    const { storedMacros } = state;
    const macrosArray = raw.split(" 0 0")[0].split(" ").map(Number);

    // Translate received macros to human readable text
    const macros: MacrosType[] = [];
    let iter = 0;
    // macros are `0` terminated or when end of macrosArray has been reached, the outer loop
    // must cycle once more than the inner
    while (iter <= macrosArray.length) {
      const actions: MacroActionsType[] = [];
      while (iter < macrosArray.length) {
        const type = macrosArray[iter];
        if (type === 0) {
          break;
        }

        switch (type) {
          case 1:
            actions.push({
              type,
              keyCode: [
                (macrosArray[(iter += 1)] << 8) + macrosArray[(iter += 1)],
                (macrosArray[(iter += 1)] << 8) + macrosArray[(iter += 1)],
              ],
            });
            break;
          case 2:
          case 3:
          case 4:
          case 5:
            actions.push({ type, keyCode: (macrosArray[(iter += 1)] << 8) + macrosArray[(iter += 1)] });
            break;
          case 6:
          case 7:
          case 8:
            actions.push({ type, keyCode: macrosArray[(iter += 1)] });
            break;
          default:
            break;
        }

        iter += 1;
      }
      macros.push({
        actions,
        name: "",
        macro: "",
      });
      iter += 1;
    }
    macros.forEach((m, idx) => {
      const aux = m;
      aux.id = idx;
      macros[idx] = aux;
    });

    // TODO: Check if stored macros match the received ones, if they match, retrieve name and apply it to current macros
    const stored = storedMacros;
    if (stored === undefined || stored.length === 0) {
      return macros;
    }
    return macros.map((macro, i) => {
      if (stored.length < i) {
        return macro;
      }

      return {
        ...macro,
        name: stored[i]?.name,
        macro: macro.actions.map(k => keymapDB.parse(k.keyCode as number).label).join(" "),
      };
    });
  };

  const loadMacros = async () => {
    const { onDisconnect, cancelContext, setLoading } = props;
    const { currentDevice } = deviceState;
    log.info("Loading macros!");
    try {
      /**
       * Create property language to the object 'options', to call KeymapDB in Keymap and modify languagu layout
       */
      let chipID = await currentDevice.command("hardware.chip_id");
      chipID = chipID.replace(/\s/g, "");
      const neurons = store.get("neurons") as Neuron[];
      state.neurons = neurons;
      state.neuronIdx = neurons.findIndex(n => n.id === chipID);
      state.storedMacros = neurons[state.neuronIdx].macros;
      setState({ ...state });
      const deviceLang = { ...currentDevice.device, language: true };
      currentDevice.commands.keymap = new Keymap(deviceLang);
      keymapDB = (currentDevice.commands.keymap as Keymap).db;
      let kbtype = "iso";
      try {
        kbtype = currentDevice.device && currentDevice.device.info.keyboardType === "ISO" ? "iso" : "ansi";
      } catch (error) {
        log.info("error when reading focus.device and kbType for Macros");
        log.error(error);
        setLoading(false);
        throw Error(error);
      }
      let tMem = 0;
      const aux = await currentDevice.command("macros.memory");
      if (typeof aux === "string") {
        tMem = 2048;
      } else {
        tMem = parseInt(aux, 10);
      }
      if (tMem === undefined || tMem < 100) tMem = 2048;
      const defaults = await currentDevice.command("keymap.default");
      const custom = await currentDevice.command("keymap.custom");
      const onlyCustom = Boolean(parseInt(await currentDevice.command("keymap.onlyCustom"), 10));
      const keymap: KeymapType = { custom: undefined, default: undefined, onlyCustom: false };

      const layerSize = currentDevice.device.keyboard.rows * currentDevice.device.keyboard.columns;
      keymap.custom = custom
        .split(" ")
        .filter(v => v.length > 0)
        .map(k => keymapDB.parse(parseInt(k, 10)))
        .reduce((resultArray, item, index) => {
          const localResultArray = resultArray;
          const chunkIndex = Math.floor(index / layerSize);

          if (!localResultArray[chunkIndex]) {
            localResultArray[chunkIndex] = []; // start a new chunk
          }
          localResultArray[chunkIndex].push(item);
          return localResultArray;
        }, []);
      keymap.default = defaults
        .split(" ")
        .filter(v => v.length > 0)
        .map(k => keymapDB.parse(parseInt(k, 10)))
        .reduce((resultArray, item, index) => {
          const localResultArray = resultArray;
          const chunkIndex = Math.floor(index / layerSize);

          if (!localResultArray[chunkIndex]) {
            localResultArray[chunkIndex] = []; // start a new chunk
          }
          localResultArray[chunkIndex].push(item);
          return localResultArray;
        }, []);
      keymap.onlyCustom = onlyCustom;
      const macrosRaw = await currentDevice.command("macros.map");
      const parsedMacros = macroTranslator(macrosRaw);
      const supersRaw = await currentDevice.command("superkeys.map");
      const parsedSuper = superTranslator(supersRaw);
      state.macros = parsedMacros;
      state.superkeys = parsedSuper;
      state.keymap = keymap;
      state.kbtype = kbtype;
      state.modified = false;
      state.usedMemory = parsedMacros.map(m => m.actions).flat().length;
      state.totalMemory = tMem;
      state.macrosEraser = Array(tMem).fill("255").join(" ");
      state.loading = false;
      setState({ ...state });
      cancelContext();
      setLoading(false);
      return true;
    } catch (error) {
      log.info("error when loading macros");
      log.error(error);
      toast.error(<ToastMessage title="Error when loading macros from the device" icon={<IconLoader />} />, { icon: "" });
      cancelContext();
      setLoading(false);
      onDisconnect();
      return false;
    }
  };

  const destroyThisContext = async () => {
    const { setLoading } = props;
    state.loading = true;
    setState({ ...state });
    await loadMacros();
    state.loading = false;
    setState({ ...state });
    setLoading(state.loading);
  };

  useEffect(() => {
    const macrosLoader = async () => {
      const { setLoading } = props;
      await loadMacros();
      state.loading = false;
      setState({ ...state });
      setLoading(state.loading);
    };
    macrosLoader();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { saveButtonRef, discardChangesButtonRef } = props;

  const {
    macros,
    maxMacros,
    modified,
    selectedList,
    selectedMacro,
    listToDelete,
    listToDeleteS,
    listToDeleteM,
    futureMacros,
    usedMemory,
    totalMemory,
    showDeleteModal,
    currentLanguageLayout,
    loading,
    scrollPos,
  } = state;

  let ListOfDeletes = listToDelete.map(({ layer, pos, key, newKey }) => {
    if (newKey === -1) {
      return (
        <li
          key={`${key.keyCode}-${layer}-${pos}-${newKey}`}
          className="text-left"
        >{`Key in Layer ${layer + 1} and pos ${pos + 1}`}</li>
      );
    }
    return "";
  });
  ListOfDeletes = ListOfDeletes.concat(
    listToDeleteS.map(({ superIdx, pos, newKey }) => {
      const actions = ["Tap", "Hold", "Tap & hold", "2Tap", "2Tap & hold"];
      if (newKey === -1) {
        return (
          <li
            key={`${superIdx}-${pos}-${newKey}`}
            className="text-left"
          >{`Key in Superkey ${superIdx + 1} and action ${actions[pos]}`}</li>
        );
      }
      return "";
    }),
  );
  ListOfDeletes = ListOfDeletes.concat(
    listToDeleteM.map(({ macroIdx, pos, newKey }) => {
      if (newKey === -1) {
        return (
          <li key={`${macroIdx}-${pos}-${newKey}`} className="text-left">{`Key in Macro ${macroIdx + 1} and action ${pos}`}</li>
        );
      }
      return "";
    }),
  );

  const ListCombo = (
    <>
      <Select onValueChange={UpdateList}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={macros.length > 0 && selectedList > -1 ? macros[selectedList]?.name : "No Key"} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={(-1).toString()} key={`macro-${-1}`} disabled={false}>
            No Key
          </SelectItem>
          {futureMacros.map(macro => (
            <SelectItem value={macro.id.toString()} key={`macro-${macro.id}`} disabled={macro.id === -1}>
              {macro?.name ? `#${macro.id + 1}. ${macro?.name}` : `#${macro.id + 1}. No name`}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  );

  if (loading) return <LogoLoader centered />;
  return (
    <Styles className="macroEditor">
      <div className="px-3">
        <PageHeader
          text="Macro Editor"
          contentSelector={
            <MacroSelector
              itemList={macros}
              selectedItem={selectedMacro}
              subtitle="Macros"
              onSelect={changeSelected}
              addItem={addMacro}
              deleteItem={deleteMacro}
              updateItem={saveName}
              cloneItem={duplicateMacro}
              maxMacros={maxMacros}
              mem={usedMemory}
              tMem={totalMemory}
            />
          }
          showSaving
          isSaving={isSaving}
          saveContext={writeMacros}
          destroyContext={destroyThisContext}
          inContext={modified}
          saveButtonRef={saveButtonRef}
          discardChangesButtonRef={discardChangesButtonRef}
        />

        <Callout
          size="sm"
          className="mt-4"
          hasVideo
          media="MfTUvFrHLsE"
          videoTitle="13 Time-saving MACROS For Your Keyboard"
          videoDuration="5:24"
        >
          <p>{i18n.editor.macros.callout1}</p>
          <p>{i18n.editor.macros.callout2}</p>
        </Callout>

        {macros[selectedMacro] === undefined || macros[selectedMacro].actions === undefined ? (
          <div />
        ) : (
          <>
            <TimelineEditorManager
              macro={macros[selectedMacro]}
              macros={macros}
              clearMacro={clearMacro}
              updateActions={updateActions}
              updateScroll={updateScroll}
              scrollPos={scrollPos}
            />
            <MacroCreator
              macro={{ ...macros[selectedMacro] }}
              macros={macros}
              selected={selectedMacro}
              addToActions={addToActions}
              selectedlanguage={currentLanguageLayout}
              triggerDeleteLastItem={timelineRef.current}
            />
          </>
        )}
      </div>

      <Dialog open={showDeleteModal} onOpenChange={toggleDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{i18n.editor.macros.deleteModal.title}</DialogTitle>
          </DialogHeader>
          <div className="px-6 pb-2 mt-2">
            {ListOfDeletes && (
              <>
                <Heading headingLevel={4} renderAs="h4">
                  The macro you want to delete is currently in use on:
                </Heading>
                <div className="mt-1 mb-4">
                  <ul className="mb-[4px] text-ssm list-disc pl-[24px] text-gray-500 dark:text-gray-100">{ListOfDeletes}</ul>
                </div>
              </>
            )}
            <p className="mb-2">{i18n.editor.macros.deleteModal.body}</p>
            {ListCombo}
          </div>
          <DialogFooter>
            <Button size="sm" variant="outline" onClick={toggleDeleteModal}>
              {i18n.editor.macros.deleteModal.cancelButton}
            </Button>
            <Button size="sm" variant="secondary" onClick={() => ActUponDelete()}>
              {i18n.editor.macros.deleteModal.applyButton}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Styles>
  );
}

export default MacroEditor;
