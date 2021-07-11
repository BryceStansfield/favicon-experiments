class FaviLib {
    constructor() {
        this.faviconElement = document.querySelector("link[rel*='icon']");
        this.uriDict = {};
        this.linkedCanvas = null;
    }
    link_to_canvas(canvas) {
        this.linkedCanvas = canvas;
    }
    update_from_canvas() {
        if (this.linkedCanvas == null) {
            console.log("Error: Tried to update from canvas without any canvas linked");
        }
        this.faviconElement.href = this.linkedCanvas.toDataURL();
    }
    update_from_image(image) {
        this.faviconElement.href = image.src;
    }
    load_uris(uris, nicknames = null) {
        for (var i = 0; i < uris.length; i += 1) {
            var im = new Image();
            var uri = uris[i];
            im.src = uri;
            if (nicknames == null) {
                this.uriDict[uri] = im;
            }
            else {
                this.uriDict[nicknames[i]] = im;
            }
        }
    }
    update_from_uri(uri) {
        this.faviconElement.href = this.uriDict[uri].src;
    }
    update_from_href(href) {
        this.faviconElement.href = href;
    }
}
//# sourceMappingURL=favilib.js.map