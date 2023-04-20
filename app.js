
	// Global variables

    var scriptVersion = "Version 193 on Mar 17, 12:05 PM"

    var spreadsheetId

    var currUser = {}

    var trpHdrs
    var trpVals
    var trpTitle
    var trpShtId
    var trpIdxArr

    var resHdrs
    var resVals
    var resTitle
    var resShtId
    var resIdxArr

    var placeTree

    var Goth
  
    var arrOptions
    var optionsIdx
  
    var timerStart

    var user = {}

    var DateTime = luxon.DateTime;

    var ukPlaces = []

    var tempAct = [[
        'endTimestamp',
        'activities[0].activityType',
        'calcDuration/60',
        'distance/1609.34',
        'calcDistance/1609.34',
        'activities?.activityType',
        'waypointPath?.waypoints.travelMode',
        'waypointPath?.waypoints.source',
        'waypointPath?.waypoints.distanceMeters/1609.34',
        'simplifiedRawPath?.source',
        'simplifiedRawPath?.distanceMeters/1609.34'
    
      ]]
    

   
/*global jQuery */
jQuery(function ($) {
	// 'use strict';


	var App = {

		init: function () {

			this.serviceWorker()
                console.log('serviceworker')

            authorize()
                console.log('authorize')

			this.bindEvents();
                console.log('bindEvents')

		},

        serviceWorker: function () {

            if ("serviceWorker" in navigator) {
                if (navigator.serviceWorker.controller) {
                  console.log("[PWA Builder] active service worker found, no need to register");
                } else {
                  // Register the service worker
                  navigator.serviceWorker
                    .register("pwabuilder-sw.js", {
                      scope: "./"
                    })
                    .then(function (reg) {
                      console.log("[PWA Builder] Service worker has been registered for scope: " + reg.scope);
                    })
                    .catch(function (err) {
                      console.log("[PWA Builder] Service worker registration failed: ", err)
                    });
                }
              }


        },

		bindEvents: function () {

            // Auth tab
          
            // $('#btnAuth')                   .button().click(btnAuthHtml);
         
            // Home tab

            $('#btnGmailDelete')        .button().click(btnGmailDeleteHtml);
            ;
            // Gmail Delete tab

            $('#gdd-delete-button').click(onDeleteClick);
            $('#gds-list-button').click(onListClick);

            alert('1')

            $('#gd-nav-delete-tab').on('show.bs.modal', loadSheetsToDelete());

            alert('2')

            var tabEl = document.querySelector('button[data-bs-toggle="tab"]')
            console.log('tabE1',tabEl)
tabEl.addEventListener('shown.bs.tab', function (event) {alert('4')
  event.target // newly activated tab
  event.relatedTarget // previous active tab
  console.log('shown', event.target, event.relatedTarget)
})
            
 alert('3')
            $('.modal').on('shown.bs.modal', function () {
                $(this).find('[autofocus]').focus();
            });
            $('.modal').on('show.bs.modal', function (e) {
                var activeElement = document.activeElement;
                $(this).on('hidden.bs.modal', function () {
                    activeElement.focus();
                    $(this).off('hidden.bs.modal');
                });
            });
          
               
		},

	};

    App.init();

});
