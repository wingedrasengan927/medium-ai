import { useState } from "react";
import GitHubIcon from "@mui/icons-material/GitHub";

type MenuBarProps = {
    currentModel: AutoCompleteModel;
    setCurrentModel: (model: AutoCompleteModel) => void;
};

export type AutoCompleteModel =
    | "davinci"
    | "curie"
    | "babbage"
    | "ada"
    | "text-davinci-003"
    | "text-davinci-002"
    | "text-davinci-001"
    | "text-curie-001"
    | "text-babbage-001"
    | "text-ada-001"
    | "none";

const MenuBar = ({ currentModel, setCurrentModel }: MenuBarProps) => {
    const models = [
        "text-davinci-003",
        "text-davinci-002",
        "text-davinci-001",
        "text-curie-001",
        "text-babbage-001",
        "text-ada-001",
        "davinci",
        "curie",
        "babbage",
        "ada",
        "none",
    ];

    const [showOptions, setShowOptions] = useState(false);

    return (
        <div className="navbar bg-white flex flex-row justify-between">
            <a
                href="https://github.com/wingedrasengan927/lexical-medium-clone"
                className="btn text-black btn-ghost normal-case text-2xl"
            >
                <GitHubIcon className="mr-2" />
                {"GitHub"}
            </a>
            <div className="mx-4">
                <div className="dropdown dropdown-end">
                    <label
                        tabIndex={0}
                        onClick={() => setShowOptions(!showOptions)}
                        className="btn btn-ghost"
                    >
                        {currentModel}
                    </label>
                    {showOptions && (
                        <ul
                            tabIndex={0}
                            className="dropdown-content menu-compact menu p-2 shadow rounded-box bg-white text-black font-lato w-44"
                        >
                            {models.map((model) => (
                                <li key={model}>
                                    <a
                                        href="#"
                                        className="hover:bg-gray-100"
                                        onClick={() => {
                                            setCurrentModel(
                                                model as AutoCompleteModel
                                            );
                                            setShowOptions(false);
                                        }}
                                    >
                                        {model}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MenuBar;
