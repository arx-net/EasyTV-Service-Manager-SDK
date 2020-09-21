module.exports = class extends Error {
    constructor(response) {
        if (response.data) {
            super(response.data.description);
            this.code = response.data.code;
        } else {
            super("Http Error " + response.status)
        }        
        this.name = "ServiceManagerError";
    }
}