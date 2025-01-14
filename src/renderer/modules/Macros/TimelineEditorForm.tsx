import React from "react";
import Styled from "styled-components";
import { IconArrowChevronLeft, IconArrowChevronRight } from "@Renderer/components/atoms/icons";
import { i18n } from "@Renderer/i18n";

import { MacroActionsType, MacrosType } from "@Renderer/types/macros";
import TimelineEditorMacroTable from "./TimelineEditorMacroTable";

const Styles = Styled.div`
.root {
  display: flex;
  flex-wrap: wrap;
}
.margin {
  margin: 1rem;
}
.textField {
  inline-size: -webkit-fill-available;
  display: flex;
}
.code {
  width: -webkit-fill-available;
}
.button {
  float: right;
}
.buttons {
  display: flex;
  position: relative;
  place-content: space-between;
  margin-top: 1rem;
}
.centered {
  place-content: center;
}
.bg {
  margin-right: 0px;
}
.form-row {
  padding: 0;
}
.row-buttons {
  justify-content: center;
}
.applybutton {
  float: right;
  margin-right: 1rem;
}
.goStart {
  left: 3px;
}
.goEnd {
  right: 3px;
}
.goStart,
.goEnd {
  width: 50px;
  height: calc(100% - 6px);
  padding: 0;
  top: 3px;
  position: absolute;
  backdrop-filter: blur(3px);
  border-radius: 4px;
  justify-content: center;
  align-self: center;
  text-align-last: center;
  z-index: 9;
  display: flex;
  transition: 300ms background-color ease-in-out;
  color: ${({ theme }) => theme.styles.button.navButton.color};
  background-color: ${({ theme }) => theme.styles.button.navButton.background};
  &:hover {
    cursor: pointer;
    background-color: ${({ theme }) => theme.styles.button.navButton.backgroundHover};
  }
}
.goStart svg,
.goEnd svg {
  margin-top: auto;
  margin-bottom: auto;
}

position: relative;
display: flex;
`;

interface Props {
  macro: MacrosType;
  macros: MacrosType[];
  updateActions: (actions: MacroActionsType[]) => void;
  componentWidth: number;
  updateScroll: (scroll: number) => void;
  scrollPos: number;
}

const MacroForm = (props: Props) => {
  const { macro, macros, updateActions, componentWidth, updateScroll, scrollPos } = props;

  const wheelPosStart = () => {
    const scrollContainer = document.getElementById("hwTracker")?.firstChild as HTMLElement;
    if (scrollContainer?.scrollLeft !== undefined) {
      scrollContainer.scrollLeft = 0;
      updateScroll(0);
    }
  };

  const wheelPosEnd = () => {
    const scrollContainer = document.getElementById("hwTracker")?.firstChild as HTMLElement;
    // console.log("checking end pos of scroll", scrollContainer, scrollContainer.scrollWidth);
    if (scrollContainer?.scrollWidth !== undefined) updateScroll(scrollContainer.scrollWidth);
  };

  if (macro === undefined || macro.actions === undefined) {
    return <div>{i18n.editor.macros.macroTab.noMacro}</div>;
  }
  return (
    <Styles>
      <button type="button" className="goStart" onClick={wheelPosStart}>
        <IconArrowChevronLeft />{" "}
      </button>
      <TimelineEditorMacroTable
        macro={macro}
        macros={macros}
        updateActions={updateActions}
        componentWidth={componentWidth}
        updateScroll={updateScroll}
        scrollPos={scrollPos}
      />
      <button type="button" className="goEnd" onClick={wheelPosEnd}>
        <IconArrowChevronRight />{" "}
      </button>
    </Styles>
  );
};
export default MacroForm;
