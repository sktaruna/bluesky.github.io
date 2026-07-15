import { PRIMITIVE, PRIMITIVE_META, IS_LLM_INVOKED } from '../../constants/primitives'
import { PRIMITIVE_ICON, SparkleIcon, TrashIcon } from '../icons'
import SayConfig from './SayConfig'
import AskConfig from './AskConfig'
import SetConfig from './SetConfig'
import DoConfig from './DoConfig'
import BranchConfig from './BranchConfig'
import GotoConfig from './GotoConfig'
import './configPanel.css'

const FORM_BY_TYPE = {
  [PRIMITIVE.SAY]: SayConfig,
  [PRIMITIVE.ASK]: AskConfig,
  [PRIMITIVE.SET]: SetConfig,
  [PRIMITIVE.DO]: DoConfig,
  [PRIMITIVE.BRANCH]: BranchConfig,
  [PRIMITIVE.GOTO]: GotoConfig,
}

export default function ConfigPanel({ node, nodes, onUpdateLabel, onUpdateConfig, onDelete, graphOps }) {
  if (!node) {
    return (
      <aside className="side-panel">
        <div className="side-panel__empty">
          <div className="side-panel__empty-title">No node selected</div>
          <p className="side-panel__empty-body">
            Click a node on the canvas to inspect and edit its configuration, or add a new primitive from the
            palette on the left.
          </p>
        </div>
      </aside>
    )
  }

  const { primitive, label, config } = node.data
  const isLlm = IS_LLM_INVOKED[primitive]
  const Icon = PRIMITIVE_ICON[primitive]
  const Form = FORM_BY_TYPE[primitive]

  return (
    <aside className="side-panel">
      <div className={`side-panel__header ${isLlm ? 'side-panel__header--llm' : ''}`}>
        <span className="side-panel__icon">
          <Icon />
        </span>
        <div className="side-panel__heading">
          <div className="side-panel__type">
            {PRIMITIVE_META[primitive].label}
            {isLlm && <SparkleIcon className="side-panel__sparkle" />}
          </div>
          <input
            className="side-panel__label-input"
            value={label}
            onChange={(e) => onUpdateLabel(e.target.value)}
          />
        </div>
        <button className="side-panel__delete" onClick={onDelete} title="Delete node">
          <TrashIcon />
        </button>
      </div>

      <div className="side-panel__body">
        <Form node={node} nodes={nodes} config={config} onUpdateConfig={onUpdateConfig} graphOps={graphOps} />
      </div>
    </aside>
  )
}
