const axios = require('axios');
const codes = require('./codes.js')
const ServiceManagerError = require('./error.js')

module.exports = class {

    constructor(baseUri = "https://sm-api.easytv.eng.it") {
        this._baseUri = baseUri;
        this._axionsOptions = {};
        this._loggedIn = false;
    }

    // Private API, not meant to be called directly.
    _result(response, autoLogout = true) {
        if (response.status == 200 && response.data.code == codes.Success) {
            return response.data;
        } else if (autoLogout && response.data.code == codes.Unauthorized) {
            this._loggedIn();
        }
        throw new ServiceManagerError(response);
    }

    _logout() {
        this._loggedIn = false;
        this._axionsOptions = {};
    }

    // Public API.
    login(username, password) {
        return axios.post(this._baseUri + "/api/user/login", {
            username: username,
            password: password
        }).then( response => {
            if (response.data.code == codes.Success) {
                this._axionsOptions = {
                    headers: {
                        "X-EasyTV-Session": response.data.session_token
                    }
                };
                this._loggedIn = true;
            }
            return this._result(response);
        })
    }

    logout() {
        if (!this._loggedIn) {
            throw new NotLoggedInError();
        }

        return axios.delete(this._baseUri + "/api/user/logout", this._axionsOptions)
            .then(response => {
                this._logout();
                // Whaterver the "response.data.code" is doesn't really matter at this point.
                // We have logged the user out.
                return true;
            })
    }

    ping() {
        if (!this._loggedIn) {
            throw new NotLoggedInError()
        }

        return axios.get(this._baseUri + "/api/user/ping", this._axionsOptions)
            .then(response => this._result(response));
    }

    changePassword(oldPassword, newPassword, newPasswordVerification) {
        if (!this._loggedIn) {
            throw new NotLoggedInError();
        } else if (newPassword != newPasswordVerification) {
            throw new PasswordsDontMatchError();
        }

        return axios.post(this._baseUri + "/api/user/change_password", {
            old_password: oldPassword,
            new_password: newPassword,
            new_password_verification: newPasswordVerification 
        }, this._axionsOptions)
            .then(response => this._result(response, false))
    }

    getServices() {
        if (!this._loggedIn) {
            throw new NotLoggedInError();
        }

        return axios.get(this._baseUri + "/api/service", this._axionsOptions)
            .then(response => this._result(response))
    }

    getService(serviceId) {
        if (!this._loggedIn) {
            throw new NotLoggedInError();
        }

        return axios.get(this._baseUri + "/api/service/" + serviceId, this._axionsOptions)
            .then(response => this._result(response))
    }

    postJob(publicationDate, expirationDate, tasks) {
        if (!this._loggedIn) {
            throw new NotLoggedInError();
        }
        
        return axios.post(this._baseUri + "/api/job", {
            publication_date: publicationDate,
            expiration_date: expirationDate,
            tasks: tasks
        }).then(response => this._result(response))
    }

    cancelJob(jobId) {
        if (!this._loggedIn) {
            throw new NotLoggedInError();
        }

        return axios.delete(this._baseUri + "/api/job/" + jobId, this._axionsOptions)
            .then(response => this._result(response))
    }

    getJobs(limit = 50, beforeJobId = null) {
        if (!this._loggedIn) {
            throw new NotLoggedInError();
        }

        var uri = this._baseUri + "/api/job"

        if (limit) {
            uri += "/limit/" + limit;

            if (beforeJobId) {
                uri += "/before/" + beforeJobId;
            }
        } 
        
        return axios.get(uri, this._axionsOptions)
            .then(response => this._result(response));
    }

    getJob(jobId) {
        if (!this._loggedIn) {
            throw new NotLoggedInError();
        }
        
        return axios.get(this._baseUri + "/api/job/" + jobId, this._axionsOptions)
            .then(response => this._result(response));
    }
}
