var svgns = "http://www.w3.org/2000/svg";
var Menu = (function () {
    function Menu(settings) {
        this.settings = settings;
    }
    Menu.prototype.setShapes = function (shapes) {
        var _this = this;
        this.shapes = shapes.map(function (str) {
            var button = document.createElement("button");
            button.addEventListener("click", function (event) { return _this.onClick("shape", str); });
            button.innerText = str;
            button.value = str;
            return button;
        });
    };
    Menu.prototype.setColors = function (colors) {
        var _this = this;
        this.colors = colors.map(function (str) {
            var button = document.createElement("button");
            button.addEventListener("click", function (event) { return _this.onClick("color", str); });
            button.style.setProperty("border-color", str);
            button.innerText = str;
            button.value = str;
            return button;
        });
    };
    Menu.prototype.setFills = function (colors) {
        var _this = this;
        this.fills = colors.map(function (str) {
            var button = document.createElement("button");
            button.addEventListener("click", function (event) { return _this.onClick("fill", str); });
            button.style.setProperty("background-color", str);
            button.innerText = str;
            button.value = str;
            return button;
        });
    };
    Menu.prototype.setSizes = function (sizes) {
        var _this = this;
        this.sizes = sizes.map(function (number) {
            var button = document.createElement("button");
            button.addEventListener("click", function (event) { return _this.onClick("size", number); });
            button.innerText = String(number);
            button.value = String(number);
            return button;
        });
    };
    Menu.prototype.getElement = function () {
        var _this = this;
        this.updateButtons();
        var menu = document.createElement("div");
        menu.classList.add("menu");
        Object.keys(this.settings).forEach(function (setting) {
            var section = document.createElement("div");
            _this[setting + "s"].forEach(function (button) { return section.appendChild(button); });
            menu.appendChild(section);
        });
        return menu;
    };
    Menu.prototype.onClick = function (setting, value) {
        this.settings[setting] = value;
        this.updateButtons();
    };
    Menu.prototype.updateButtons = function () {
        var _this = this;
        Object.keys(this.settings).forEach(function (setting) {
            _this[setting + "s"].forEach(function (button) {
                if (button.value == _this.settings[setting])
                    button.classList.add("selected");
                else
                    button.classList.remove("selected");
            });
        });
    };
    return Menu;
}());
var SVGEditor = (function () {
    function SVGEditor(editorConfig) {
        this.objects = [];
        this.originalMousePosition = null;
        this.lastMousePosition = null;
        this.currentMousePosition = null;
        this.createdObject = null;
        this.focusedObject = null;
        this.svg = SVGEditor.createSVG(editorConfig.dimension);
        this.attachEvents(this.svg);
        var menu = this.createMenu();
        this.codeSection = document.createElement("pre");
        var editor = document.createElement("div");
        editor.classList.add("svg-editor");
        editor.appendChild(menu);
        editor.appendChild(this.svg);
        editor.appendChild(this.codeSection);
        editorConfig.element.appendChild(editor);
    }
    SVGEditor.createSVG = function (dimension) {
        var svg = document.createElementNS(svgns, "svg");
        svg.setAttribute("width", dimension.width);
        svg.setAttribute("height", dimension.height);
        return svg;
    };
    SVGEditor.prototype.attachEvents = function (svg) {
        svg.addEventListener("mousedown", this.onMouseDown.bind(this));
        svg.addEventListener("mousemove", this.onMouseMove.bind(this));
        svg.addEventListener("mouseup", this.onMouseUp.bind(this));
    };
    SVGEditor.prototype.createMenu = function () {
        this.menuSettings = {
            shape: "path",
            color: "black",
            fill: "none",
            size: 3
        };
        var menu = new Menu(this.menuSettings);
        menu.setColors(["black", "red", "blue", "yellow"]);
        menu.setFills(["none", "black", "red", "blue", "yellow"]);
        menu.setSizes([1, 2, 3, 4, 5]);
        menu.setShapes(["rect", "line", "circle", "ellipse", "path"]);
        return menu.getElement();
    };
    SVGEditor.prototype.updateCode = function () {
        this.codeSection.innerText = this.svg.innerHTML.replace(new RegExp("><", "g"), ">\n<");
    };
    SVGEditor.prototype.onMouseDown = function (event) {
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
                var start = "M " + this.currentMousePosition.x + " " + this.currentMousePosition.y;
                this.createdObject.setAttributeNS(null, "d", start);
        }
    };
    SVGEditor.prototype.onMouseMove = function (event) {
        // Ignore if not in mouse event
        if (this.originalMousePosition === null)
            return;
        this.lastMousePosition = this.currentMousePosition;
        this.currentMousePosition = { x: event.offsetX, y: event.offsetY };
        this.updateCurrentObject();
    };
    SVGEditor.prototype.onMouseUp = function () {
        // If shape is nothing
        if (this.originalMousePosition.x != this.currentMousePosition.x ||
            this.originalMousePosition.y != this.currentMousePosition.y) {
            this.objects.push(this.createdObject);
            this.focus(this.createdObject);
        }
        else if (this.menuSettings.shape !== "path") {
            this.svg.removeChild(this.createdObject);
        }
        // TODO: If path, compress
        this.originalMousePosition = this.lastMousePosition = this.currentMousePosition = null;
        this.createdObject = null;
    };
    SVGEditor.prototype.focus = function (object) {
    };
    SVGEditor.prototype.updateCurrentObject = function () {
        var topLeft = {
            x: Math.min(this.currentMousePosition.x, this.originalMousePosition.x),
            y: Math.min(this.currentMousePosition.y, this.originalMousePosition.y)
        };
        var bottomRight = {
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
                var radius = Math.max(bottomRight.x - topLeft.x, bottomRight.y - topLeft.y) / 2;
                this.createdObject.setAttributeNS(null, "r", String(radius));
                break;
            case "ellipse":
                this.createdObject.setAttributeNS(null, "cx", String((topLeft.x + bottomRight.x) / 2));
                this.createdObject.setAttributeNS(null, "cy", String((topLeft.y + bottomRight.y) / 2));
                this.createdObject.setAttributeNS(null, "rx", String((bottomRight.x - topLeft.x) / 2));
                this.createdObject.setAttributeNS(null, "ry", String((bottomRight.y - topLeft.y) / 2));
                break;
            case "path":
                var d = this.createdObject.getAttribute("d") + " l ";
                d += this.currentMousePosition.x - this.lastMousePosition.x;
                d += " ";
                d += this.currentMousePosition.y - this.lastMousePosition.y;
                this.createdObject.setAttributeNS(null, "d", d);
        }
        this.updateCode();
    };
    return SVGEditor;
}());
document.addEventListener("DOMContentLoaded", function () {
    new SVGEditor({
        element: document.body,
        dimension: {
            width: "100%",
            height: "500px"
        }
    });
}, false);
