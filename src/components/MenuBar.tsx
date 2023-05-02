import GitHubIcon from "@mui/icons-material/GitHub";

const MenuBar = () => {
    return (
        <div className="navbar bg-white">
            <a
                href="https://github.com/wingedrasengan927/lexical-medium-clone"
                className="btn text-black btn-ghost normal-case text-2xl"
            >
                <GitHubIcon className="mr-2" />
                {"GitHub"}
            </a>
        </div>
    );
};

export default MenuBar;
