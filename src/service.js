const axios = require('axios');
const codes = require('./codes.js');
const ServiceManagerError = require('./error.js');


module.exports = class {

    constructor (apiKey, baseUri = "https://sm-api.easytv.eng.it")
    {
        this._apiKey = apiKey;
        this._baseUri = baseUri;
        this._apiKeyHeader = {
            headers: {
                "X-EasyTV-Key": apiKey
            }
        }
    }

    // Private API, not meant to be called directly.
    _result(response, autoLogout) {
        if (response.status == 200 && response.data.code == codes.Success) {
            return response.data;
        }
        throw new ServiceManagerError(response);
    }

    // Public API.
    registerTask(name, description, startUrl, cancelUrl, input, output, useRestCancel = false) {
        var data = {
            name: name,
            description: description,
            start_url: startUrl,
            input: input,
            output: output,
        }

        if (useRestCancel) {
            data["cancel_rest_url"] = cancelUrl;
        } else {
            data["cancel_url"] = cancelUrl;
        }

        return axios.post(this._baseUri + "/internal/task", data, this._apiKeyHeader)
            .then(response => this._result(response));
    }

    setTaskAvailability(taskId, availability) {
        return axios.put(this._baseUri + "/internal/task/"+ taskId, {
            disabled: !availability
        }, this._apiKeyHeader).then(response => this._result(response));
    }

    deleteTask(taskId) {
        return axios.delete(this._baseUri + "/internal/task/" + taskId, this._apiKeyHeader)
            .then(response => this._result(response));
    }

    getTasks() {
        return axios.get(this._baseUri + "/internal/task", this._apiKeyHeader)
            .then(response => this._result(response));
    }

    getJobs(limit = 50, before = undefined) {
        var uri = "/internal/job";

        if (limit != undefined) {
            uri += "/limit/" + limit;

            if (before != undefined) {
                uri += "/before/" + before;
            }
        }

        return axios.get(this._baseUri + uri, this._apiKeyHeader)
            .then(response => this._result(response));
    }

    getJob(jobId) {
        if (isNaN(parseFloat(jobId)) || !isFinite(jobId)) {
            return null;
        }

        return axios.get(this._baseUri + "/internal/job/" + jobId, this._apiKeyHeader)
            .then(response => this._result(response));
    }

    setStatus(jobId, status) {
        return axios.put(this._baseUri + "/internal/job/"+ jobId, {
            status: status
        }, this._apiKeyHeader).then(response => this._result(response));
    }

    cancelJob(jobId) {
        return axios.delete(this._baseUri + "/internal/job/" + jobId, this._apiKeyHeader)
            .then(response => this._result(response));
    }

    getAssets(jobId) {
        return axios.get(this._baseUri + "/internal/job/" + jobId + "/asset", this._apiKeyHeader)
            .then(response => this._result(response));
    }

    uploadAsset(asset, jobId) {
        let data = new FormData();
        data.append('asset', asset);

        return axios.post(this._baseUri + "/internal/job/" + jobId + "/asset", data, {
            headers: {
                'Content-Type': 'multipart/form-data',
                'X-EasyTV-Key': this._apiKey
            }
        }).then(response => this._result(response));
    }

    finishJob(jobId, output) {
        return axios.post(this._baseUri + "/internal/job/" + jobId + "/finish", {
            output: output
        }, this._apiKeyHeader).then(response => this._result(response));
    }
}