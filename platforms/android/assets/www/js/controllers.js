angular.module('app.controllers', [])

.controller('homeCtrl', function ($scope, $rootScope, $state, $timeout, $ionicPlatform, $ionicHistory, $window, User) {

    $scope.vendorDetails = {};

    //Wait for 3 seconds
    $timeout(function () {
        $ionicPlatform.ready(function () {
            User.all().then(function (result) {
                //If user already exists, redirect to menu page
                if (result.length > 0) {
                    //Disable animation
                    /*$ionicHistory.nextViewOptions({
                        disableAnimate: true,
                        disableBack: true
                    });*/
                    $window.vendorDetails = result[0];
                    $state.go("menu");
                    return;
                } else { //Else redirect to register page
                    $state.go("newVendor");
                }
            })

        });
    }, 3000);

})

.controller('newVendorCtrl', function ($scope, $rootScope, $state, $window, User, RestAPI, dialogs) {

    //newVendor model
    $scope.newVendor = {
        msisdn: '5493515065992',
        name: 'Cristian',
        vin: 123456,
        email: 'cristian.mpx@gmail.com',
        address: 'Sal Salvador'
    }

    //Change API IP
    $scope.changeAPI = function () {
        dialogs.showPrompt("Change URL API", "Your REST Url here: ", function (res) {
            $window.APIUrl = res;
        }, 'text', (angular.isDefined($window.APIUrl)) ? $window.APIUrl : 'http://10.0.1.12:8080/pagusss');
    }

    //Create a new vendor
    $scope.createNewVendor = function () {

        //Disable submit button
        $scope.btnDisabled = true;

        //Send vendor register data to remote server
        RestAPI.newVendor().do($scope.newVendor, function (res) {

            //If response is success
            if (typeof res.data === "object" && res.data.length == 1) {
                var newUser = [];

                //Is status is valid
                if (res.status == true) {
                    //Push vendor details in object
                    newUser.name = res.data[0].name;
                    newUser.msisdn = res.data[0].msisdn;
                    newUser.skey = res.data[0].skey;
                    //Store new user in local SQLite
                    User.add(newUser).then(function (result) {
                        newUser.id = result.insertId;
                        $window.vendorDetails = newUser;

                        dialogs.showAlert("Bienvenido a PaguSSS", "Gracias por registrarse.", function (res) {
                            //Redirect to main menu
                            $state.go("menu");
                        });
                        
                    })

                } else {
                    dialogs.showAlert("Error", res.msg + ".\n\n Código de error: " + res.code);
                    //Re-enable submit button
                    $scope.btnDisabled = false;
                }
            }
        }, function (error) { //On HTTP error
            //if any error occurs
            if (error.status == 0) {
                dialogs.showAlert("Error", "No se pudo establecer la conexion con el sistema. Si el problema persiste, por favor contactar al proveedor.");
            } else {
                dialogs.showAlert("Error", "Se produjo un error en la transacción. \n\n Código de error: " + error.data.code);
            }

            //Re-enable submit button
            $scope.btnDisabled = false;
        });
    }
})

.controller('menuCtrl', function ($scope) {

})

.controller('createOrderCtrl', function ($scope, $rootScope, $window, $interval, RestAPI, dialogs, nfcService, HardwareBackButtonManager) {

    var timeoutPin = undefined;
    var transactionId = undefined;
    var controlNumber = undefined;
    var userMSISDN = undefined;
    var amount = undefined;

    //Buttons settings
    $scope.buttons = {
        authDisable : true,
        authText: '',
        createDisable: true,
        createText: '',
        confirmDisable: true,
        confirmText : '',
        cancelDisable: true,
        cancelText : ''
    }     

    //Model of new order form
    $scope.newOrder = {
        controlNumber: 0,
        vendor: '',
        amount: 0,
        description: '',
        user: '',
        userPin: ''
    }

    //Restore buttons states
    $scope.restoreButtons = function () {
        $scope.buttons.authDisable = false;
        $scope.buttons.authText = 'Solicitar autorizaci&oacute;n';
        $scope.buttons.createDisable = true;
        $scope.buttons.createText = 'Generar';
        $scope.buttons.confirmDisable = true;
        $scope.buttons.confirmText = 'Confirmar';
        $scope.buttons.cancelDisable = true;
        $scope.buttons.cancelText = 'Cancelar';
    }
    $scope.restoreButtons();

    //Prepare data holder to send the transaction to remote server
    $scope.buildAndSendDataHolder = function (data) {
        var trxData = {};
        
        angular.copy($scope.newOrder, trxData)

        trxData.vendor = $window.vendorDetails.msisdn;
        trxData.user = data.user.msisdn;
        trxData.userPin = data.user.pin;
        trxData.amount = trxData.amount * 100000;

        //alert(angular.toJson($scope.newOrder));

        //Create a new transaction
        RestAPI.createTransaction().do(trxData, function (res) {
            transactionId = undefined;
            controlNumber = undefined;
            userMSISDN = undefined;
            amount = undefined;

            //alert(angular.toJson(res));

            //If response is success
            if (typeof res.data === "object" && res.data.length == 1) {
                //Is status is valid
                if (res.status == true) {
                    //Disable auth button
                    $scope.buttons.authDisable = true;
                    //Enable confirm button
                    $scope.buttons.confirmDisable = false;
                    //Enable cancel button
                    $scope.buttons.cancelDisable = false;

                    //Store transaction ID & control number in order to confirm the transaction
                    transactionId = res.data[0].id;
                    controlNumber = trxData.controlNumber;
                    userMSISDN = trxData.user;
                    amount = trxData.amount / 100000;

                    dialogs.showAlert("Transacci&oacute;n exitosa.", "La transacci&oacute;n se ha ejecutado existosamente. Si desea finalizar la orden, por favor haga click en <b>Confirmar</b>.");
                } else {
                    dialogs.showAlert("Error", "La transacci&oacute;n no pudo ser efectuada. " + res.msg + ".\n\n C&oacute;digo de error: " + res.code);
                }
            } else {
                dialogs.showAlert("Error", res.msg + ".\n\n C&oacute;digo de error: " + res.code);
            }
        }, function (error) { //On HTTP error
            //if any error occurs
            if (error.status == 0) {
                dialogs.showAlert("Error", "No se pudo establecer la conexion con el sistema. Si el problema persiste, por favor contactar al proveedor.");
            } else {
                dialogs.showAlert("Error", "Se produjo un error en la transacción. \n\n Código de error: " + error.data.code);
            }
        });
    }

    //Set interval for client PIN confirmation
    $scope.waitForPINConfirm = function () {
        var counterInterval = 30;

        timeoutPin = $interval(function () {
            var t = counterInterval--;
            t = t - 1;

            if (t == 0) {
                $scope.buttons.authText = "Tiempo de expera excedido.";
                dialogs.showConfirm("Tiempo de espera excedido.", "Se ha excedido el tiempo de espera. Presione <b>Esperar</b> para continuar esperando la confirmaci&oacute;n o <b>Cancelar</b> si desea abortar la operaci&oacute;n.", function (res) {
                    dialogs.close();
                    if (res) {
                        $scope.waitForPINConfirm();
                    } else if (!res) {
                        $scope.reset();
                    }

                },'Cancelar','Esperar');
            } else {
                $scope.buttons.authText = "Tiempo restante: " + t;
            }
        }, 1000, counterInterval);
    }

    //Reset operation
    $scope.reset = function () {
        //Cancel timeout
        if(angular.isDefined(timeoutPin))$interval.cancel(timeoutPin);

        //Unshare data
        nfcService.unshareData();

        //Restore the nfc listener
        nfcService.removeListener($scope.nfcSuccessCb);

        //Restore buttons states
        $scope.restoreButtons();

    }

    //NFC listener callback
    $scope.nfcListenerCb = function () {

        //Wait for client confirmation
        $scope.waitForPINConfirm();
    }

    //NFC error callback
    $scope.nfcErrorCb = function (reason) {
        //Close current opened dialog
        dialogs.close();

        //Remove previous callback listener
        //nfcService.removeListener($scope.nfcSuccessCb);
        $scope.reset();

        if (reason == "NO_NFC") {
            dialogs.showAlert("Error", "Este dispotivo no posee NFC.");
        } else if (reason == "NFC_DISABLED") {
            dialogs.showAlert("NFC desactivado", "Por favor habilitar el NFC para continuar.");
            if (typeof cordova.plugins.settings.openSetting != undefined) {
                cordova.plugins.settings.openSetting("nfc_settings", function () {
                    //cope.sText("opened nfc settings")
                },
                function () {
                    //$scope.sText("failed to open nfc settings")
                });
            }
        } else {
            dialogs.showAlert("Error en NFC", "Se produjo un error durante la recepci&oacute;n de los datos. [" + reason + "].");
        }            
    }

    //NFC success callback
    $scope.nfcSuccessCb = function (nfcEvent) {        
        //Unshare previous data shared
        //nfcService.unshareData();

        //Close opened dialog
        dialogs.close(true);

        //Verify NFC response
        var data = nfcService.checkJsonNFCData(nfcEvent, $scope.nfcErrorCb);

        if (angular.isDefined(data)) {
            //alert(angular.toJson(data));
            if (!angular.isDefined(data.user.msisdn) || !angular.isDefined(data.user.pin)) {
                dialogs.showAlert("Error", "Los datos recibidos no son v&aacute;lidos. Reintente la operaci&oacute;n.");
            } else {
                $scope.buildAndSendDataHolder(data);
            }
            $scope.reset();
        }
    }

    //NFC share success callback
    $scope.nfcSharedSuccessCb = function () {

        //Enable cancel button
        $scope.buttons.cancelDisable = false;
        //Disable auth button
        $scope.buttons.authDisable = true;

        //Force close to false to avoid unshare data
        dialogs.close(false);

        dialogs.showAlert("Autorizaci&oacute;n enviada", "La autorizaci&oacute;n se ha enviado correctamente al dispositivo del cliente. Por favor socilite al cliente que ingrese su PIN en su dispositivo y, posteriormente, aproximar ambos dispositivos para recibir la confirmaci&oacute;n. Presione OK para continuar y esperar confirmaci&oacute;n del cliente.", function (res) {

        });

        //Add new NFC listener
        nfcService.addListener($scope.nfcSuccessCb, $scope.nfcListenerCb, $scope.nfcErrorCb);
    }

    //Helper function 
    function showData(data) {
        $scope.newOrder.data = $scope.newOrder.data + data + "\n";
    }

    //Invoke NFC client authorization
    $scope.doAuthClick = function () {
        //Prepare data to send to client device
        var buildNFCRequestData = function () {
            var data = {};

            //Random control number
            $scope.newOrder.controlNumber = Math.floor(100000 + Math.random() * 900000);

            data.controlNumber = $scope.newOrder.controlNumber;
            data.amount = $scope.newOrder.amount * 100000;
            data.description = $scope.newOrder.description;
            data.pinRequest = true;

            return data;
        }

        dialogs.showAlert("Enviar autorizaci&oacute;n", "Por favor comunicar al cliente que inicie la aplicaci&oacute;n de <b>Pagu$$$</b> y que, posteriormente, aproxime su celular a la cara trasera de este dispositivo. Una vez que ambos dispositivos se encuentren cercanos, por favor presione la pantalla para confirmar o cancelar para anular la operaci&oacute;n", function (res) {
            //Unshare data if hw back or 'cancelar' button is pressed
            if ((typeof res === 'undefined') || (res)) nfcService.unshareData();
        }, "Cancelar");
                          
        //Send authorization data to client
        nfcService.shareData(buildNFCRequestData(), $scope.nfcSharedSuccessCb, $scope.nfcErrorCb);
    }

    //Create order after authorization
    $scope.doOrderClick = function () {        

    }

    //Confirm order
    $scope.doConfirmClick = function () {

        //Disable confirm & cancel buttton
        $scope.buttons.confirmDisable = true;
        $scope.buttons.cancelDisable = true;

        dialogs.showConfirm("Confirmar transacci&oacute;n.", "¿Desea confirmar la transacci&oacute;n?", function (res) {
            if (res) {
                //Send transaction confirmation to server
                RestAPI.confirmTransaction().do({ id: transactionId }, { controlNumber: controlNumber, user: userMSISDN, amount: (amount * 100000) }, function (res) {
                    //If response is success
                    if (angular.isDefined(res.status)) {
                        
                        //Is status is valid
                        if (res.status == true) {
                            dialogs.showAlert("Transacci&oacute;n exitosa.", "La transacci&oacute;n se ha concreatado exitosamente.",function(res){
                                $scope.reset(); 
                            });

                        } else {
                            dialogs.showAlert("Error", res.msg + ".\n\n Código de error: " + res.code);

                            //Enable confirm & cancel buttton
                            $scope.buttons.confirmDisable = false;
                            $scope.buttons.cancelDisable = false;
                        }
                    }
                }, function (error) { //On HTTP error
                    //if any error occurs
                    if (error.status == 0) {
                        dialogs.showAlert("Error", "No se pudo establecer la conexion con el sistema. Si el problema persiste, por favor contactar al proveedor.");
                    } else {
                        dialogs.showAlert("Error", "Se produjo un error en la transacción. \n\n Código de error: " + error.data.code);
                    }
                    //Enable confirm & cancel buttton
                    $scope.buttons.confirmDisable = false;
                    $scope.buttons.cancelDisable = false;

                });
            } else {
                $scope.buttons.confirmDisable = false;
                $scope.buttons.cancelDisable = false;
            }
        })
    }

    //Cancel order creation
    $scope.doCancelClick = function () {
        
        //Enable confirm & cancel buttton
        $scope.buttons.confirmDisable = true;
        $scope.buttons.cancelDisable = true;

        if (angular.isDefined(transactionId) && angular.isDefined(controlNumber)) {
            dialogs.showConfirm("Cancelar transacci&oacute;n.", "¿Est&aacute; seguro que desea cancelar la transacci&oacute;n?", function (res) {
                if (res) {
                    //alert(angular.toJson(res));

                    RestAPI.cancelTransaction().do({ id: transactionId }, { controlNumber: controlNumber }, function (res) {
                        //alert(angular.toJson(res));
                        //If response is success
                        if (angular.isDefined(res.status)) {                            
                            //Is status is valid
                            if (res.status == true) {
                                dialogs.showAlert("Transacci&oacute;n cancelada.", "La transacci&oacute;n se ha cancelado exitosamente.",function(res){
                                    $scope.reset(); 
                                });

                            } else {
                                dialogs.showAlert("Error", res.msg + ".\n\n Código de error: " + res.code);

                                //Enable confirm & cancel buttton
                                $scope.buttons.confirmDisable = false;
                                $scope.buttons.cancelDisable = false;
                            }
                        }
                    }, function (error) { //On HTTP error
                        //if any error occurs
                        if (error.status == 0) {
                            dialogs.showAlert("Error", "No se pudo establecer la conexion con el sistema. Si el problema persiste, por favor contactar al proveedor.");
                        } else {
                            dialogs.showAlert("Error", "Se produjo un error en la transacción. \n\n Código de error: " + error.data.code);
                        }
                        //Enable confirm & cancel buttton
                        $scope.buttons.confirmDisable = false;
                        $scope.buttons.cancelDisable = false;

                    });
                } else {
                    $scope.buttons.confirmDisable = false;
                    $scope.buttons.cancelDisable = false;
                }
            })
        }else{
            dialogs.showConfirm("Cancelar autorizaci&oacute;n.", "¿Est&aacute; seguro que desea cancelar la operaci&oacute;n?", function (res) {
                if (res) {
                    //Cancel operation
                    $scope.reset();
                }          
            })
        }
    }

    //When view is closed
    $scope.$on('$destroy', function () {
        $scope.reset();
    });
})


.controller('cancelOrderCtrl', function ($scope, RestAPI) {
    
})

.controller('queryOrderCtrl', function ($scope) {

})