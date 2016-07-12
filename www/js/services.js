angular.module('app.services', ['app.config'])

//Creates DBA factory to init database
.factory('DBA', function($cordovaSQLite, $q, $ionicPlatform, PAGUS_DB_CONFIG){
    var self = this;
    self.db = null;

    //Initialize the database
    self.init = function () {
        // Use self.db = window.sqlitePlugin.openDatabase({name: DB_CONFIG.name}); in production
        //self.db = window.openDatabase(DB_CONFIG.name, '1.0', 'database', -1);

        if (window.cordova) {
            self.db = $cordovaSQLite.openDB({ name: PAGUS_DB_CONFIG.name, location: 2 }); //device
        } else {
            self.db = window.openDatabase(PAGUS_DB_CONFIG.name, '1.0', 'database', 1024 * 1024 * 100); // browser
        }

        //Create tables defined in config.js
        angular.forEach(PAGUS_DB_CONFIG.tables, function (table) {
            var columns = [];

            angular.forEach(table.columns, function (column) {
                columns.push(column.name + ' ' + column.type);
            });

            var query = 'CREATE TABLE IF NOT EXISTS ' + table.name + ' (' + columns.join(',') + ')';
            self.query(query);
            console.log('Table ' + table.name + ' initialized');
        });
        return self.db;
    };

    //Perform query
    self.query = function (query, parameters) {
        parameters = parameters || [];
        var q = $q.defer();

        //When engine is ready
        $ionicPlatform.ready(function () {
            $cordovaSQLite.execute(self.db, query, parameters).then(function (result) {
                q.resolve(result);
            }, function (error) {
                console.warn(error);
                q.reject(error);
            });
        });
        return q.promise;
    }

    // Get all records 
    self.getAll = function (result) {
        var output = [];

        for (var i = 0; i < result.rows.length; i++) {
            output.push(result.rows.item(i));
        }
        return output;
    }

    // Get record by ID
    self.getById = function (result) {
        var output = null;
        output = angular.copy(result.rows.item(0));
        return output;
    }

    return self;
})

.factory('User', function ($cordovaSQLite, DBA, APP_PARAMS) {
    var self = this;

    self.all = function () {
        var parameters = [APP_PARAMS.type];
        return DBA.query("SELECT id, name, msisdn, skey FROM user WHERE type = (?)", parameters)
          .then(function (result) {
              return DBA.getAll(result);
          });
    }

    self.get = function (userId) {
        var parameters = [userId, APP_PARAMS.type];
        return DBA.query("SELECT id, name, msisdn, skey FROM user WHERE id = (?) AND type = (?)", parameters)
          .then(function (result) {
              return DBA.getById(result);
          });
    }

    self.getTotal = function () {
        var parameters = [APP_PARAMS.type];
        return DBA.query("SELECT COUNT(*) AS total FROM user WHERE type = (?)", parameters);
    }

    self.add = function (user) {
        var parameters = [user.name, user.msisdn, user.skey, APP_PARAMS.type];
        return DBA.query("INSERT INTO user (name, msisdn, skey, type) VALUES (?,?,?,?)", parameters);
    }

    self.remove = function (user) {
        var parameters = [user.id, APP_PARAMS.type];
        return DBA.query("DELETE FROM user WHERE id = (?) AND type = (?)", parameters);
    }

    self.update = function (currentUser, newUser) {
        var parameters = [currentUser.id, newUser.name, newUser.msisdn, newUser.skey, currentUser.id, APP_PARAMS.type];
        return DBA.query("UPDATE user SET id = (?), name = (?), msisdn = (?), skey = (?) WHERE id = (?) AND type = (?)", parameters);
    }

    return self;
})

.service('RestAPI', function ($resource, $httpParamSerializer, $window, PAGUS_API_ENDPOINT) {
    var self = this;

    var transformRequestData = function (data) {
        data = $httpParamSerializer(data)
        return data;
    }

    var buildUrl = function (url) {
        var url = (angular.isDefined(url)) ? url : ((angular.isDefined($window.APIUrl)) ? $window.APIUrl : PAGUS_API_ENDPOINT.url);
        return url;
    }

    //New vendor 
    self.newVendor = function (url) {
        return $resource(buildUrl(url) + '/vendor', {}, {
            do: {
                method: 'POST',
                transformRequest: transformRequestData,
                timeout: 10000
            }
        })
    }

    //Create transaction
    self.createTransaction = function (url) {
        return $resource(buildUrl(url) + '/transaction', {}, {
            do: {
                method: 'POST',
                transformRequest: transformRequestData,
                timeout: 10000
            }
        })
    }

    //Confirm transaction
    self.confirmTransaction = function (url) {
        return $resource(buildUrl(url) + '/transaction/:id', {}, {
            do: {
                method: 'PUT',
                transformRequest: transformRequestData,
                timeout: 10000
            }
        })
    }

    //Confirm transaction
    self.cancelTransaction = function (url) {
        return $resource(buildUrl(url) + '/transaction/cancel/:id', {}, {
            do: {
                method: 'PUT',
                transformRequest: transformRequestData,
                timeout: 10000
            }
        })
    }

    return self;

    /*return $resource(PAGUS_API_ENDPOINT.url + '/vendor', {}, {
        newVendor: {
            method: 'POST',
            url: PAGUS_API_ENDPOINT.url + '/vendor',
            transformRequest: transformRequestData,
            timeout: 10000
        },
        createTransaction: {
            method: 'POST',
            url: PAGUS_API_ENDPOINT.url + '/transaction',
            transformRequest: transformRequestData,
            timeout: 10000
        },
        confirmTransaction: {
            method: 'PUT',
            url: PAGUS_API_ENDPOINT.url + '/transaction/:id',
            transformRequest: transformRequestData,
            timeout: 10000
        },
        cancelTransaction: {
            method: 'PUT',
            url: PAGUS_API_ENDPOINT.url + '/transaction/cancel/:id',
            transformRequest: transformRequestData,
            timeout: 10000
        },
        test: {
            method: 'GET',
            url: 'http://192.168.1.117:8080/pagusss/test'
        }
    });*/
})

.service('dialogs', function ($ionicPopup) {
    var self = this;

    self.currentDialog = undefined;

    self.close = function (value) {
        if (angular.isDefined(self.currentDialog)) {
            if (angular.isDefined(value)) self.currentDialog.close(value);
            else self.currentDialog.close();
            self.currentDialog = undefined;
        }
    }

    self.getCurrentDialog = function () {
        return self.currentDialog;
    }

    //Popup alert
    self.showAlert = function (title, message, cb, okText) {
        var alertPopup = $ionicPopup.alert({
            title: title,
            template: message,
            okText: (typeof okText === 'undefined') ? "OK" : okText
        });

        self.currentDialog = alertPopup;

        alertPopup.then(function (res) {
            if (typeof cb === 'function') cb(res);
        });
          

        return alertPopup;
    };

    //Popup confirm
    self.showConfirm = function (title, message, cb, cancelText, okText) {
        var confirmPopup = $ionicPopup.confirm({
            title: title,
            template: message,
            cancelText: (typeof okText === 'undefined') ? "NO" : cancelText,
            okText: (typeof okText === 'undefined') ? "S&Iacute;" : okText
        });

        self.currentDialog = confirmPopup;

        confirmPopup.then(function (res) {
            if (typeof cb === 'function') cb(res);
        });

        return confirmPopup;

    }

    //prompt dialog
    self.showPrompt = function (title, message, cb, inputType, defaultText, cancelText, okText) {
        var prompt = $ionicPopup.prompt({
            title: title,
            template: message,
            inputType: inputType,
            defaultText: (typeof defaultText === 'undefined') ? "" : defaultText,
            cancelText: (typeof okText === 'undefined') ? "Cancelar" : cancelText,
            okText: (typeof okText === 'undefined') ? "Aceptar" : okText
        });

        self.currentDialog = prompt;

        prompt.then(function (res) {
            if (typeof cb === 'function') cb(res);
        });
        return prompt;
    }

    return self;

})

.service('HardwareBackButtonManager', function ($ionicPlatform) {
    this.deregister = undefined;

    this.disable = function () {
        this.deregister = $ionicPlatform.registerBackButtonAction(function (e) {
            e.preventDefault();
            return false;
        }, 101);
    }

    this.enable = function () {
        if (this.deregister !== undefined) {
            this.deregister();
            this.deregister = undefined;
        }
    }

    return this;
})

.factory('nfcService', function ($rootScope, $ionicPlatform, $timeout, $filter) {
    var self = this;
    var dataSharedFlag = false;

    self.shareData = function (objData, successCb, errorCb) {
        var type = "text/json",
            id = [],
            payload = nfc.stringToBytes(angular.toJson(objData)),
            record = ndef.record(ndef.TNF_MIME_MEDIA, type, id, payload);

        dataSharedFlag = true;

        return nfc.share([record], successCb, errorCb);
    }

    self.unshareData = function () {
        dataSharedFlag = false;
        return nfc.unshare();
    }
        
    self.isSharedData = function () {
        return dataSharedFlag;
    }

    /*self.checkJsonNFCData = function (nfcEvent, successCb, errorCb) {
        var jsonObj = {};
        var ndefMsg = (typeof nfcEvent.tag.ndefMessage === 'object') ? nfcEvent.tag.ndefMessage : null;
        var received;

        //Validate received ndefMessage. Should be a valid object
        if (typeof ndefMsg === 'object' || ndefMsg.length > 0) {

            //Mime Media type allowed should be 2
            if (ndefMsg[0].tnf != 2) {
                errorCb("INVALID_TNF");
            }
                //Record type always text/json
            else if ($filter('bytesToString')(ndefMsg[0].type) != 'text/json') {
                errorCb("INVALID_RECORD_TYPE");
            } else {

                received = $filter('decodePayload')(ndefMsg[0]); //JSON string

                //Valid JSON string
                try {//JSON string to object
                    jsonObj = JSON.parse(received);
                    successCb(jsonObj);
                } catch (exception) {
                    jsonObj = {};
                    errorCb('MALFORMED_JSON');
                }
            }
        } else {
            errorCb("INVALID_DATA");
        }
    };*/

    self.checkJsonNFCData = function (nfcEvent, errorCb) {
        var jsonObj = undefined;
        var ndefMsg = (typeof nfcEvent.tag.ndefMessage === 'object') ? nfcEvent.tag.ndefMessage : null;
        var received;

        //Validate received ndefMessage. Should be a valid object
        if (typeof ndefMsg === 'object' || ndefMsg.length > 0) {

            //Mime Media type allowed should be 2
            if (ndefMsg[0].tnf != 2) {
                errorCb("INVALID_TNF");
            }
                //Record type always text/json
            else if ($filter('bytesToString')(ndefMsg[0].type) != 'text/json') {
                errorCb("INVALID_RECORD_TYPE");
            } else {

                received = $filter('decodePayload')(ndefMsg[0]); //JSON string

                //Valid JSON string
                try {//JSON string to object
                    jsonObj = JSON.parse(received);
                    return jsonObj;
                } catch (exception) {
                    errorCb('MALFORMED_JSON');
                }
            }
        } else {
            errorCb("INVALID_DATA");
        }
        return jsonObj;
    };

    self.addListener = function (successCb, listenCb, errorCb) {
        return nfc.addMimeTypeListener('text/json', successCb, listenCb, errorCb);
    };

    self.removeListener = function(successCb){
        return nfc.removeMimeTypeListener('text/json', successCb);
    }

    return self;

    /*return {
        tag: self.tag,

        clearTag: function () {
            angular.copy({}, self.tag);
        },

        shareData: function (objData, successCb, errorCb) {
            return self.shareData(objData, successCb, errorCb);
        },

        unshareData : function(){
            return self.unshareData();
        },

        addListener: function (resCb, listenCb, errorCb) {
            return self.addListener(resCb, listenCb, errorCb);
        }

    };*/
});