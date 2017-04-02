const svgns = "http://www.w3.org/2000/svg";

interface MenuSettings {
    shape: string;
    color: string;
    fill: string;
    size: number;
}

class Menu {
    private shapes: Array<HTMLButtonElement>;
    private colors: Array<HTMLButtonElement>;
    private fills: Array<HTMLButtonElement>;
    private sizes: Array<HTMLButtonElement>;

    constructor(private settings: MenuSettings) {
    }

    setShapes(shapes: Array<string>) {
        this.shapes = shapes.map(str => {
            const button = document.createElement("button");
            button.addEventListener("click", (event) => this.onClick("shape", str));
            button.innerText = str;
            button.value = str;

            return button;
        });
    }

    setColors(colors: Array<string>) {
        this.colors = colors.map(str => {
            const button = document.createElement("button");
            button.addEventListener("click", (event) => this.onClick("color", str));
            button.style.setProperty("border-color", str);
            button.innerText = str;
            button.value = str;

            return button;
        });
    }

    setFills(colors: Array<string>) {
        this.fills = colors.map(str => {
            const button = document.createElement("button");
            button.addEventListener("click", (event) => this.onClick("fill", str));
            button.style.setProperty("background-color", str);
            button.innerText = str;
            button.value = str;

            return button;
        });
    }

    setSizes(sizes: Array<number>) {
        this.sizes = sizes.map(number => {
            const button = document.createElement("button");
            button.addEventListener("click", (event) => this.onClick("size", number));
            button.innerText = String(number);
            button.value = String(number);

            return button;
        });
    }

    getElement(): HTMLDivElement {
        this.updateButtons();

        const menu = document.createElement("div");
        menu.classList.add("menu")

        Object.keys(this.settings).forEach((setting) => {
            const section = document.createElement("div");
            this[setting + "s"].forEach((button: HTMLButtonElement) => section.appendChild(button));
            menu.appendChild(section);
        });

        return menu;
    }

    private onClick(setting: string, value: string | number) {
        this.settings[setting] = value;
        this.updateButtons();
    }

    private updateButtons() {
        Object.keys(this.settings).forEach((setting) => {
            this[setting + "s"].forEach((button: HTMLButtonElement) => {
                if (button.value == this.settings[setting])
                    button.classList.add("selected");
                else
                    button.classList.remove("selected");
            });
        });
    }
}

interface MousePosition {
    x: number;
    y: number;
}

interface Dimension {
    height: string;
    width: string;
}

interface EditorConfig {
    element: HTMLElement;
    dimension: Dimension;
}

class SVGEditor {
    private svg: SVGSVGElement;
    private objects: Array<SVGElement> = [];

    private codeSection: HTMLPreElement;

    private originalMousePosition: MousePosition = null;
    private lastMousePosition: MousePosition = null;
    private currentMousePosition: MousePosition = null;

    private createdObject: SVGElement = null;
    private focusedObject: SVGElement = null;

    private menuSettings: MenuSettings;

    constructor(editorConfig: EditorConfig) {
        this.svg = SVGEditor.createSVG(editorConfig.dimension);
        this.attachEvents(this.svg);

        const menu = this.createMenu();

        this.codeSection = document.createElement("pre");

        const editor = document.createElement("div");
        editor.classList.add("svg-editor");
        editor.appendChild(menu);
        editor.appendChild(this.svg);
        editor.appendChild(this.codeSection);

        editorConfig.element.appendChild(editor);
    }

    private static createSVG(dimension: Dimension): SVGSVGElement {
        const svg = document.createElementNS(svgns, "svg");
        svg.setAttribute("width", dimension.width);
        svg.setAttribute("height", dimension.height);

        return svg;
    }

    private attachEvents(svg: SVGSVGElement) {
        svg.addEventListener("mousedown", this.onMouseDown.bind(this));
        svg.addEventListener("mousemove", this.onMouseMove.bind(this));
        svg.addEventListener("mouseup", this.onMouseUp.bind(this));
    }

    private createMenu(): HTMLElement {
        this.menuSettings = {
            shape: "path",
            color: "black",
            fill: "none",
            size: 3
        };

        const menu = new Menu(this.menuSettings);
        menu.setColors(["black", "red", "blue", "yellow"]);
        menu.setFills(["none", "black", "red", "blue", "yellow"]);
        menu.setSizes([1, 2, 3, 4, 5]);
        menu.setShapes(["rect", "line", "circle", "ellipse", "path"]);

        return menu.getElement();
    }

    private updateCode() {
        this.codeSection.innerText = this.svg.innerHTML.replace(new RegExp("><", "g"), ">\n<");
    }

    private onMouseDown(event) {
        this.createdObject = document.createElementNS(svgns, this.menuSettings.shape);
        this.createdObject.setAttributeNS(null, "fill", this.menuSettings.fill);
        this.createdObject.setAttributeNS(null, "stroke", this.menuSettings.color);
        this.createdObject.setAttributeNS(null, "stroke-width", String(this.menuSettings.size));
        this.svg.appendChild(this.createdObject);

        this.originalMousePosition = this.lastMousePosition = this.currentMousePosition = {
            x: event.offsetX,
            y: event.offsetY
        };

        switch (this.menuSettings.shape) {
            case "path":
                const start = "M " + this.currentMousePosition.x + " " + this.currentMousePosition.y;
                this.createdObject.setAttributeNS(null, "d", start);
        }
    }

    private onMouseMove(event) {
        // Ignore if not in mouse event
        if (this.originalMousePosition === null)
            return;

        this.lastMousePosition = this.currentMousePosition;
        this.currentMousePosition = {x: event.offsetX, y: event.offsetY};

        this.updateCurrentObject();
    }

    private onMouseUp() {
        // If shape is nothing
        if (this.originalMousePosition.x != this.currentMousePosition.x ||
            this.originalMousePosition.y != this.currentMousePosition.y) {
            this.objects.push(this.createdObject);
            this.focus(this.createdObject);
        } else {
            this.svg.removeChild(this.createdObject);
        }

        // TODO: If path, compress

        this.originalMousePosition = this.lastMousePosition = this.currentMousePosition = null;
        this.createdObject = null;
    }

    private focus(object: SVGElement) {

    }

    private updateCurrentObject() {
        const topLeft: MousePosition = {
            x: Math.min(this.currentMousePosition.x, this.originalMousePosition.x),
            y: Math.min(this.currentMousePosition.y, this.originalMousePosition.y)
        };

        const bottomRight: MousePosition = {
            x: Math.max(this.currentMousePosition.x, this.originalMousePosition.x),
            y: Math.max(this.currentMousePosition.y, this.originalMousePosition.y)
        };

        switch (this.menuSettings.shape) {
            case "line":
                this.createdObject.setAttributeNS(null, "x1", String(this.originalMousePosition.x));
                this.createdObject.setAttributeNS(null, "y1", String(this.originalMousePosition.y));
                this.createdObject.setAttributeNS(null, "x2", String(this.currentMousePosition.x));
                this.createdObject.setAttributeNS(null, "y2", String(this.currentMousePosition.y));
                break;
            case "rect":
                this.createdObject.setAttributeNS(null, "x", String(topLeft.x));
                this.createdObject.setAttributeNS(null, "y", String(topLeft.y));
                this.createdObject.setAttributeNS(null, "width", String(bottomRight.x - topLeft.x));
                this.createdObject.setAttributeNS(null, "height", String(bottomRight.y - topLeft.y));
                break;
            case "circle":
                this.createdObject.setAttributeNS(null, "cx", String((topLeft.x + bottomRight.x) / 2));
                this.createdObject.setAttributeNS(null, "cy", String((topLeft.y + bottomRight.y) / 2));
                const radius = Math.max(bottomRight.x - topLeft.x, bottomRight.y - topLeft.y) / 2;
                this.createdObject.setAttributeNS(null, "r", String(radius));
                break;
            case "ellipse":
                this.createdObject.setAttributeNS(null, "cx", String((topLeft.x + bottomRight.x) / 2));
                this.createdObject.setAttributeNS(null, "cy", String((topLeft.y + bottomRight.y) / 2));
                this.createdObject.setAttributeNS(null, "rx", String((bottomRight.x - topLeft.x) / 2));
                this.createdObject.setAttributeNS(null, "ry", String((bottomRight.y - topLeft.y) / 2));
                break;
            case "path":
                let d = this.createdObject.getAttribute("d") + " l ";
                d += this.currentMousePosition.x - this.lastMousePosition.x;
                d += " ";
                d += this.currentMousePosition.y - this.lastMousePosition.y;
                this.createdObject.setAttributeNS(null, "d", d);

        }

        this.updateCode();
    }
}

document.addEventListener("DOMContentLoaded", () => {
    new SVGEditor({
        element: document.body,
        dimension: {
            width: "100%",
            height: "500px"
        }
    });
}, false);