import React from "react";

import Styled from "styled-components";
import i18n from "../../i18n";
import Tab from "react-bootstrap/Tab";
import Nav from "react-bootstrap/Nav";

import Keymap, { KeymapDB } from "../../../api/keymap";

//component
import { RegularButton } from "../../component/Button";
import KeyVisualizer from "../KeyVisualizer";
import CustomTab from "../../component/Tab";
import TextTab from "../KeysTabs/TextTab";
import KeysTab from "../KeysTabs/KeysTab";
import LayersTab from "../KeysTabs/LayersTab";
import MacroTab from "../KeysTabs/MacroTab";
import DelayTab from "../KeysTabs/DelayTab";
import MediaAndLightTab from "../KeysTabs/MediaAndLightTab";
import MouseTab from "../KeysTabs/MouseTab";

//Icons
import { IconKeyboard, IconLetterColor, IconMouse, IconLayers, IconRobot, IconNote, IconStopWatch } from "../../component/Icon";

const Styles = Styled.div`
.standardView {
    position: fixed;
    width: 100%;
    height: 100vh;
    top: 0;
    left: 0;
    background-color: ${({ theme }) => theme.styles.standardView.modalBackground};
    z-index: 500;
    padding: 32px 32px 32px 164px;
    .standardViewInner {
        width: 100%;
        height: 100%;
        display: grid;
        grid-gap: 14px;
        grid-template-columns: minmax(200px, 220px) 1fr;
    }
}
.colContentTabs {
    height: 100%;
    display: flex;
    flex-wrap: wrap;
    background-color: ${({ theme }) => theme.styles.standardView.contentBackground};
    border-radius: 6px;
    .contentBody {
        flex-grow: 1;
        margin-bottom: auto;
    }
    .contentFooter {
        width: 100%;
        padding: 24px;
        background-color: black;
        margin-top: auto;
        border-radius: 6px;
        background-color: ${({ theme }) => theme.styles.standardView.footerBackground};
        .button + .button {
            margin-left: 12px;
        }
    }
}
.KeyVisualizer {
  margin-top: 42px;
  width: calc(100% + 20px);
  background: #25273B;
  border: 1px solid rgba(63, 66, 90, 0.3);
  box-shadow: 32px 32px 64px -12px rgba(11, 2, 25, 0.4), 32px 32px 72px -32px rgba(26, 17, 46, 0.5);
  border-radius: 6px;
  min-height: 262px;
}
`;

export default class StandardView extends React.Component {
  constructor(props) {
    super(props);
    this.inputText = React.createRef();
    this.state = {
      name: props.name
    };
    this.keymapDB = new KeymapDB();
  }

  parseKey(keycode) {
    const macro = this.props.macros[parseInt(this.keymapDB.parse(keycode).label)];
    let macroName;
    try {
      macroName = this.props.macros[parseInt(this.keymapDB.parse(keycode).label)].name.substr(0, 5);
    } catch (error) {
      macroName = "*NotFound*";
    }
    if (keycode >= 53852 && keycode <= 53852 + 64) {
      if (this.props.code !== null) return this.keymapDB.parse(keycode).extraLabel + "." + macroName;
    }
    return this.props.code !== null
      ? this.keymapDB.parse(keycode).extraLabel != undefined
        ? this.keymapDB.parse(keycode).extraLabel + "." + this.keymapDB.parse(keycode).label
        : this.keymapDB.parse(keycode).label
      : "";
  }

  render() {
    const { showStandardView, closeStandardView, code, macros, handleSave, modalTitle, labelInput, id } = this.props;
    const selKey = this.parseKey(code.base + code.modified);
    if (!showStandardView) return null;
    return (
      <Styles>
        <div className="standardView">
          <Tab.Container id="standardViewCointainer" defaultActiveKey="tabKeys">
            <div className="standardViewInner">
              <div className="colVisualizerTabs">
                <KeyVisualizer keyCode={code} oldValue={selKey} newValue={selKey} />
                <Nav className="flex-column">
                  <CustomTab eventKey="tabKeys" text="Keys" icon={<IconKeyboard />} />
                  <CustomTab eventKey="tabLayers" text="Layers" icon={<IconLayers />} />
                  <CustomTab eventKey="tabMacro" text="Macro" icon={<IconRobot />} />
                  <CustomTab eventKey="tabMedia" text="Media & LED" icon={<IconNote />} />
                  <CustomTab eventKey="tabMouse" text="Mouse" icon={<IconMouse />} />
                </Nav>
              </div>
              <div className="colContentTabs">
                <div className="contentBody">
                  <Tab.Content>
                    <Tab.Pane eventKey="tabKeys">
                      <KeysTab macros={macros} />
                    </Tab.Pane>
                    <Tab.Pane eventKey="tabLayers">
                      <LayersTab />
                    </Tab.Pane>
                    <Tab.Pane eventKey="tabMacro">
                      <MacroTab macros={macros} selectedMacro={this.state.selected} />
                    </Tab.Pane>
                    <Tab.Pane eventKey="tabMedia">
                      <MediaAndLightTab />
                    </Tab.Pane>
                    <Tab.Pane eventKey="tabMouse">
                      <MouseTab />
                    </Tab.Pane>
                  </Tab.Content>
                </div>
                <div className="contentFooter">
                  <div className="d-flex justify-content-end">
                    <RegularButton
                      onClick={closeStandardView}
                      style={"outline"}
                      size="sm"
                      buttonText={i18n.app.cancelPending.button}
                    />
                    <RegularButton
                      onClick={handleSave}
                      style={"outline gradient"}
                      size="sm"
                      buttonText={i18n.components.save.button}
                    />
                  </div>
                </div>
              </div>
            </div>
          </Tab.Container>
        </div>
      </Styles>
    );
  }
}