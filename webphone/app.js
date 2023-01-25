var sTransferNumber;
var oRingTone, oRingbackTone;
var oSipStack, oSipSessionRegister, oSipSessionCall, oSipSessionTransferCall;
var audioRemote;
var bFullScreen = false;
var oNotifICall;
var bDisableVideo = true;
var oConfigCall;
var oReadyStateTimer;
var ringBackToneEn = false;

var cbVideoDisable;
var cbAVPFDisable;
var txtWebsocketServerUrl;
var txtSIPOutboundProxyUrl;
var txtInfo;
var autoAnswer = false;

window.onload = function () {
	
	cbVideoDisable = document.getElementById("cbVideoDisable");
	cbRTCWebBreaker = document.getElementById("cbRTCWebBreaker");
	txtWebsocketServerUrl = document.getElementById("txtWebsocketServerUrl");
	txtSIPOutboundProxyUrl = document.getElementById("txtSIPOutboundProxyUrl");
	txtInfo = document.getElementById("txtInfo");
		
	window.console && window.console.info && window.console.info("location=" + window.location);

	videoLocal = document.getElementById("video_local");
	videoRemote = document.getElementById("video_remote");
	audioRemote = document.getElementById("audio_remote");

	divCallCtrl.onmousemove = onDivCallCtrlMouseMove;

	// set debug level
	SIPml.setDebugLevel((localStorage && localStorage.getItem('mhrgl.com.expert.disable_debug') == "true") ? "error" : "info");

	loadCallOptions();

	// Initialize call button
	uiBtnCallSetText("Call");

	var getPVal = function (PName) {
		var query = window.location.search.substring(1);
		var vars = query.split('&');
		for (var i = 0; i < vars.length; i++) {
			var pair = vars[i].split('=');
			if (decodeURIComponent(pair[0]) === PName) {
				return decodeURIComponent(pair[1]);
			}
		}
		return null;
	}

	var preInit = function () {
		// set default webrtc type (before initialization)
		var s_webrtc_type = getPVal("wt");
		var s_fps = getPVal("fps");
		var s_mvs = getPVal("mvs"); // maxVideoSize
		var s_mbwu = getPVal("mbwu"); // maxBandwidthUp (kbps)
		var s_mbwd = getPVal("mbwd"); // maxBandwidthUp (kbps)
		var s_za = getPVal("za"); // ZeroArtifacts
		var s_ndb = getPVal("ndb"); // NativeDebug

		if (s_webrtc_type) SIPml.setWebRtcType(s_webrtc_type);

		// initialize SIPML5
		SIPml.init(postInit);

		// set other options after initialization
		if (s_fps) SIPml.setFps(parseFloat(s_fps));
		if (s_mvs) SIPml.setMaxVideoSize(s_mvs);
		if (s_mbwu) SIPml.setMaxBandwidthUp(parseFloat(s_mbwu));
		if (s_mbwd) SIPml.setMaxBandwidthDown(parseFloat(s_mbwd));
		if (s_za) SIPml.setZeroArtifacts(s_za === "true");
		if (s_ndb == "true") SIPml.startNativeDebug();


	}

	oReadyStateTimer = setInterval(function () {
		if (document.readyState === "complete") {
			clearInterval(oReadyStateTimer);
			// initialize SIPML5
			preInit();
		}
	},
	500);

};

function postInit() {
	// check for WebRTC support
	if (!SIPml.isWebRtcSupported()) {
		// is it chrome?
		if (SIPml.getNavigatorFriendlyName() == 'chrome') {
			if (confirm("You're using an old Chrome version or WebRTC is not enabled.\nDo you want to see how to enable WebRTC?")) {
				window.location = 'http://www.webrtc.org/running-the-demos';
			}
			else {
				window.location = "index.html";
			}
			return;
		}
		else {
			if (confirm("webrtc-everywhere extension is not installed. Do you want to install it?\nIMPORTANT: You must restart your browser after the installation.")) {
				window.location = 'https://github.com/sarandogou/webrtc-everywhere';
			}
		}
	}

	// checks for WebSocket support
	if (!SIPml.isWebSocketSupported()) {
		if (confirm('Your browser don\'t support WebSockets.\nDo you want to download a WebSocket-capable browser?')) {
			window.location = 'https://www.google.com/intl/en/chrome/browser/';
		}
		else {
			window.location = "index.html";
		}
		return;
	}



	if (!SIPml.isWebRtcSupported()) {
		if (confirm('Your browser don\'t support WebRTC.\naudio/video calls will be disabled.\nDo you want to download a WebRTC-capable browser?')) {
			window.location = 'https://www.google.com/intl/en/chrome/browser/';
		}
	}

	//btnRegister.disabled = false;
	document.body.style.cursor = 'default';
	oConfigCall = {
		audio_remote: audioRemote,
		bandwidth: { audio: undefined, video: undefined },
		events_listener: { events: '*', listener: onSipEventSession },
		sip_caps: [
						{ name: '+g.oma.sip-im' },
						{ name: 'language', value: '\"en,fr\"' }
		]
	};
	sipRegister();
}


function loadCallOptions() {
	if (localStorage) {
		var s_value;
		if ((s_value = localStorage.getItem('mhrgl.com.call.phone_number'))) txtPhoneNumber.value = s_value;
		bDisableVideo = (localStorage.getItem('mhrgl.com.expert.disable_video') == "true");

		txtCallStatus.innerHTML = '<i>Video ' + (bDisableVideo ? 'disabled' : 'enabled') + '</i>';
	}
}

function saveCallOptions() {
	if (localStorage) {
		localStorage.setItem('mhrgl.com.call.phone_number', txtPhoneNumber.value);
		localStorage.setItem('mhrgl.com.expert.disable_video', bDisableVideo ? "true" : "false");
	}
}


// sends SIP REGISTER request to login
function sipRegister() {
	// catch exception for IE (DOM not ready)
	try {
		//btnRegister.disabled = true;
		
		var o_impu = localStorage.getItem('mhrgl.com.identity.impu');
		

		// enable notifications if not already done
		if (window.webkitNotifications && window.webkitNotifications.checkPermission() != 0) {
			window.webkitNotifications.requestPermission();
		}

		// save credentials
		//saveCredentials();

		// update debug level to be sure new values will be used if the user haven't updated the page
		SIPml.setDebugLevel((localStorage && localStorage.getItem('mhrgl.com.expert.disable_debug') == "true") ? "error" : "info");

		// create SIP stack
		oSipStack = new SIPml.Stack({
			realm: (localStorage ? localStorage.getItem('mhrgl.com.identity.realm') : null),
			impi: (localStorage ? localStorage.getItem('mhrgl.com.identity.impi') : null),
			impu: (localStorage ? localStorage.getItem('mhrgl.com.identity.impu') : null),
			password: (localStorage ? localStorage.getItem('mhrgl.com.identity.password') : null),
			display_name: (localStorage ? localStorage.getItem('mhrgl.com.identity.display_name') : null),
			websocket_proxy_url: (localStorage ? localStorage.getItem('mhrgl.com.expert.websocket_server_url') : null),
			outbound_proxy_url: (localStorage ? localStorage.getItem('mhrgl.com.expert.sip_outboundproxy_url') : null),
			ice_servers: (localStorage ? localStorage.getItem('mhrgl.com.expert.ice_servers') : null),
			enable_rtcweb_breaker: true,
			events_listener: { events: '*', listener: onSipEventStack },
			enable_early_ims: false, // Must be true unless you're using a real IMS network
			enable_media_stream_cache: false,
			bandwidth: (localStorage ? tsk_string_to_object(localStorage.getItem('mhrgl.com.expert.bandwidth')) : null), // could be redefined a session-level
			video_size: (localStorage ? tsk_string_to_object(localStorage.getItem('mhrgl.com.expert.video_size')) : null), // could be redefined a session-level
			sip_headers: [
					{ name: 'User-Agent', value: 'mhrgl.com.webphone' },
					{ name: 'Organization', value: 'mhrgl.com' }
			]
		}
		);
		if (oSipStack.start() != 0) {
			txtRegStatus.innerHTML = '<b>Failed to start the SIP stack</b>';
		}
		else return;
	}
	catch (e) {
		txtRegStatus.innerHTML = "<b>2:" + e + "</b>";
	}
	//btnRegister.disabled = false;
}

// sends SIP REGISTER (expires=0) to logout
function sipUnRegister() {
	if (oSipStack) {
		oSipStack.stop(); // shutdown all sessions
	}
}

// makes a call (SIP INVITE)
function sipCall(s_type) {
	if (oSipStack && !oSipSessionCall && !tsk_string_is_null_or_empty(txtPhoneNumber.value)) {
		
		btnCall.disabled = true;
		btnHangUp.disabled = false;

		// create call session
		oSipSessionCall = oSipStack.newSession(s_type, oConfigCall);
		// make call
		if (oSipSessionCall.call(txtPhoneNumber.value) != 0) {
			oSipSessionCall = null;
			txtCallStatus.value = 'Failed to make call';
			btnCall.disabled = false;
			btnHangUp.disabled = true;
			return;
		}
		saveCallOptions();
	}
	else if (oSipSessionCall) {
		txtCallStatus.innerHTML = '<i>Connecting...</i>';
		oSipSessionCall.accept(oConfigCall);
	}
}

// transfers the call
function sipTransfer() {
	if (oSipSessionCall) {
		var s_destination = prompt('Enter destination number', '');
		if (!tsk_string_is_null_or_empty(s_destination)) {
			btnTransfer.disabled = true;
			if (oSipSessionCall.transfer(s_destination) != 0) {
				txtCallStatus.innerHTML = '<i>Call transfer failed</i>';
				btnTransfer.disabled = false;
				return;
			}
			txtCallStatus.innerHTML = '<i>Transfering the call...</i>';
		}
	}
}

// holds or resumes the call
function sipToggleHoldResume() {
	if (oSipSessionCall) {
		var i_ret;
		btnHoldResume.disabled = true;
		txtCallStatus.innerHTML = oSipSessionCall.bHeld ? '<i>Resuming the call...</i>' : '<i>Holding the call...</i>';
		i_ret = oSipSessionCall.bHeld ? oSipSessionCall.resume() : oSipSessionCall.hold();
		if (i_ret != 0) {
			txtCallStatus.innerHTML = '<i>Hold / Resume failed</i>';
			btnHoldResume.disabled = false;
			return;
		}
	}
}

// Mute or Unmute the call
function sipToggleMute() {
	if (oSipSessionCall) {
		var i_ret;
		var bMute = !oSipSessionCall.bMute;
		txtCallStatus.innerHTML = bMute ? '<i>Mute the call...</i>' : '<i>Unmute the call...</i>';
		i_ret = oSipSessionCall.mute('audio'/*could be 'video'*/, bMute);
		if (i_ret != 0) {
			txtCallStatus.innerHTML = '<i>Mute / Unmute failed</i>';
			return;
		}
		oSipSessionCall.bMute = bMute;
		btnMute.value = bMute ? "Unmute" : "Mute";
	}
}

// terminates the call (SIP BYE or CANCEL)
function sipHangUp() {
	if (oSipSessionCall) {
		txtCallStatus.innerHTML = '<i>Terminating the call...</i>';
		oSipSessionCall.hangup({ events_listener: { events: '*', listener: onSipEventSession } });
	}
}

function sipSendDTMF(c) {
	if (oSipSessionCall && c) {
		if (oSipSessionCall.dtmf(c) == 0) {
			try { dtmfTone.play(); } catch (e) { }
		}
	}
}

function startRingTone() {
	try { ringtone.play(); }
	catch (e) { }
}

function stopRingTone() {
	try { ringtone.pause(); }
	catch (e) { }
}

function startRingbackTone() {
	try { ringbacktone.play(); }
	catch (e) { }
}

function stopRingbackTone() {
	try { ringbacktone.pause(); }
	catch (e) { }
}


function openKeyPad() {
	divKeyPad.style.visibility = 'visible';
	divKeyPad.style.left = ((document.body.clientWidth - 220) >> 1) + 'px';
	divKeyPad.style.top = '70px';
}

function closeKeyPad() {
	divKeyPad.style.left = '0px';
	divKeyPad.style.top = '0px';
	divKeyPad.style.visibility = 'hidden';
}

function showNotifICall(s_number) {
	// permission already asked when we registered
	if (window.webkitNotifications && window.webkitNotifications.checkPermission() == 0) {
		if (oNotifICall) {
			oNotifICall.cancel();
		}
		oNotifICall = window.webkitNotifications.createNotification('images/sipml-34x39.png', 'Incaming call', 'Incoming call from ' + s_number);
		oNotifICall.onclose = function () { oNotifICall = null; };
		oNotifICall.show();
	}
}


function onDivCallCtrlMouseMove(evt) {
	try { // IE: DOM not ready
		if (tsk_utils_have_stream()) {
			btnCall.disabled = (!tsk_utils_have_stream() || !oSipSessionRegister || !oSipSessionRegister.is_connected());
			document.getElementById("divCallCtrl").onmousemove = null; // unsubscribe
		}
	}
	catch (e) { }
}

function uiOnConnectionEvent(b_connected, b_connecting) { // should be enum: connecting, connected, terminating, terminated
	btnCall.disabled = !(b_connected && tsk_utils_have_webrtc() && tsk_utils_have_stream());
	btnHangUp.disabled = !oSipSessionCall;
}


function uiDisableCallOptions() {
	if (localStorage) {
		localStorage.setItem('mhrgl.com.expert.disable_callbtn_options', 'true');
		uiBtnCallSetText('Call');
		alert('Use expert view to enable the options again (/!\\requires re-loading the page)');
	}
}

function uiBtnCallSetText(s_text) {
	switch (s_text) {
		case "Call":
			{
				var bDisableCallBtnOptions = (localStorage && localStorage.getItem('mhrgl.com.expert.disable_callbtn_options') == "true");
				btnCall.value = btnCall.innerHTML = bDisableCallBtnOptions ? 'Call' : 'Call <span id="spanCaret" class="caret">';
				btnCall.setAttribute("class", bDisableCallBtnOptions ? "btn btn-primary" : "btn btn-primary dropdown-toggle");
				btnCall.onclick = bDisableCallBtnOptions ? function () { sipCall(bDisableVideo ? 'call-audio' : 'call-audiovideo'); } : null;
				ulCallOptions.style.visibility = bDisableCallBtnOptions ? "hidden" : "visible";
				if (!bDisableCallBtnOptions && ulCallOptions.parentNode != divBtnCallGroup) {
					divBtnCallGroup.appendChild(ulCallOptions);
				}
				else if (bDisableCallBtnOptions && ulCallOptions.parentNode == divBtnCallGroup) {
					document.body.appendChild(ulCallOptions);
				}

				break;
			}
		default:
			{
				btnCall.value = btnCall.innerHTML = s_text;
				btnCall.setAttribute("class", "btn btn-primary");
				btnCall.onclick = function () { sipCall(bDisableVideo ? 'call-audio' : 'call-audiovideo'); };
				ulCallOptions.style.visibility = "hidden";
				if (ulCallOptions.parentNode == divBtnCallGroup) {
					document.body.appendChild(ulCallOptions);
				}
				break;
			}
	}
}

function uiCallTerminated(s_description) {
	uiBtnCallSetText("Call");
	btnHangUp.value = 'HangUp';
	btnHoldResume.value = 'hold';
	btnMute.value = "Mute";
	btnCall.disabled = false;
	btnHangUp.disabled = true;
	if (window.btnBFCP) window.btnBFCP.disabled = true;

	oSipSessionCall = null;

	stopRingbackTone();
	stopRingTone();

	txtCallStatus.innerHTML = "<i>" + s_description + "</i>";

	if (oNotifICall) {
		oNotifICall.cancel();
		oNotifICall = null;
	}

	setTimeout(function () { if (!oSipSessionCall) txtCallStatus.innerHTML = ''; }, 2500);
}

// Callback function for SIP Stacks
function onSipEventStack(e /*SIPml.Stack.Event*/) {
	tsk_utils_log_info('==stack event = ' + e.type);
	switch (e.type) {
		case 'started':
			{
				// catch exception for IE (DOM not ready)
				try {
					// LogIn (REGISTER) as soon as the stack finish starting
					oSipSessionRegister = this.newSession('register', {
						expires: 200,
						events_listener: { events: '*', listener: onSipEventSession },
						sip_caps: [
									{ name: '+g.oma.sip-im', value: null },
									//{ name: '+sip.ice' }, // rfc5768: FIXME doesn't work with Polycom TelePresence
									{ name: '+audio', value: null },
									{ name: 'language', value: '\"en,fr\"' }
						]
					});
					oSipSessionRegister.register();
				}
				catch (e) {
					txtRegStatus.value = txtRegStatus.innerHTML = "<b>1:" + e + "</b>";
				}
				break;
			}
		case 'stopping': case 'stopped': case 'failed_to_start': case 'failed_to_stop':
			{
				var bFailure = (e.type == 'failed_to_start') || (e.type == 'failed_to_stop');
				oSipStack = null;
				oSipSessionRegister = null;
				oSipSessionCall = null;

				uiOnConnectionEvent(false, false);

				stopRingbackTone();
				stopRingTone();


				txtCallStatus.innerHTML = '';
				txtRegStatus.innerHTML = bFailure ? "<i>Disconnected: <b>" + e.description + "</b></i>" : "<i>Disconnected</i>";
				break;
			}

		case 'i_new_call':
			{
				if (oSipSessionCall) {
					// do not accept the incoming call if we're already 'in call'
					e.newSession.hangup(); // comment this line for multi-line support
				}
				else {
					oSipSessionCall = e.newSession;
					// start listening for events
					oSipSessionCall.setConfiguration(oConfigCall);

					uiBtnCallSetText('Answer');
					btnHangUp.value = 'Reject';
					btnCall.disabled = false;
					btnHangUp.disabled = false;

					startRingTone();

					var sRemoteNumber = (oSipSessionCall.getRemoteFriendlyName() || 'unknown');
					txtCallStatus.innerHTML = "<i>Incoming call from [<b>" + sRemoteNumber + "</b>]</i>";
					showNotifICall(sRemoteNumber);
					window.focus();
					if(autoAnswer){
						oSipSessionCall.accept(oConfigCall);
					}
				}
				break;
			}

		case 'starting': default: break;
	}
};

// Callback function for SIP sessions (INVITE, REGISTER, MESSAGE...)
function onSipEventSession(e /* SIPml.Session.Event */) {
	tsk_utils_log_info('==session event = ' + e.type);

	switch (e.type) {
		case 'connecting': case 'connected':
			{
				var bConnected = (e.type == 'connected');
				if (e.session == oSipSessionRegister) {
					uiOnConnectionEvent(bConnected, !bConnected);
					txtRegStatus.innerHTML = "<i>" + e.description + "</i>";
				}
				else if (e.session == oSipSessionCall) {
					btnHangUp.value = 'HangUp';
					btnCall.disabled = true;
					btnHangUp.disabled = false;
					btnTransfer.disabled = false;
					if (window.btnBFCP) window.btnBFCP.disabled = false;

					if (bConnected) {
						stopRingbackTone();
						stopRingTone();

						if (oNotifICall) {
							oNotifICall.cancel();
							oNotifICall = null;
						}
					}

					txtCallStatus.innerHTML = "<i>" + e.description + "</i>";
				}
				break;
			} // 'connecting' | 'connected'
		case 'terminating': case 'terminated':
			{
				if (e.session == oSipSessionRegister) {
					uiOnConnectionEvent(false, false);

					oSipSessionCall = null;
					oSipSessionRegister = null;

					txtRegStatus.innerHTML = "<i>" + e.description + "</i>";
				}
				else if (e.session == oSipSessionCall) {
					uiCallTerminated(e.description);
				}
				break;
			} // 'terminating' | 'terminated'

		case 'm_stream_audio_local_added':
		case 'm_stream_audio_local_removed':
		case 'm_stream_audio_remote_added':
		case 'm_stream_audio_remote_removed':
			{
				break;
			}

		case 'i_ect_new_call':
			{
				oSipSessionTransferCall = e.session;
				break;
			}

		case 'i_ao_request':
			{
				if (e.session == oSipSessionCall) {
					var iSipResponseCode = e.getSipResponseCode();
					if (iSipResponseCode == 180 || iSipResponseCode == 183) {
						startRingbackTone();
						txtCallStatus.innerHTML = '<i>Remote ringing...</i>';
					}
				}
				break;
			}

		case 'm_early_media':
			{
				if (e.session == oSipSessionCall) {
					stopRingbackTone();
					stopRingTone();
					txtCallStatus.innerHTML = '<i>Early media started</i>';
				}
				break;
			}

		case 'm_local_hold_ok':
			{
				if (e.session == oSipSessionCall) {
					if (oSipSessionCall.bTransfering) {
						oSipSessionCall.bTransfering = false;
						// this.AVSession.TransferCall(this.transferUri);
					}
					btnHoldResume.value = 'Resume';
					btnHoldResume.disabled = false;
					txtCallStatus.innerHTML = '<i>Call placed on hold</i>';
					oSipSessionCall.bHeld = true;
				}
				break;
			}
		case 'm_local_hold_nok':
			{
				if (e.session == oSipSessionCall) {
					oSipSessionCall.bTransfering = false;
					btnHoldResume.value = 'Hold';
					btnHoldResume.disabled = false;
					txtCallStatus.innerHTML = '<i>Failed to place remote party on hold</i>';
				}
				break;
			}
		case 'm_local_resume_ok':
			{
				if (e.session == oSipSessionCall) {
					oSipSessionCall.bTransfering = false;
					btnHoldResume.value = 'Hold';
					btnHoldResume.disabled = false;
					txtCallStatus.innerHTML = '<i>Call taken off hold</i>';
					oSipSessionCall.bHeld = false;
				}
				break;
			}
		case 'm_local_resume_nok':
			{
				if (e.session == oSipSessionCall) {
					oSipSessionCall.bTransfering = false;
					btnHoldResume.disabled = false;
					txtCallStatus.innerHTML = '<i>Failed to unhold call</i>';
				}
				break;
			}
		case 'm_remote_hold':
			{
				if (e.session == oSipSessionCall) {
					txtCallStatus.innerHTML = '<i>Placed on hold by remote party</i>';
				}
				break;
			}
		case 'm_remote_resume':
			{
				if (e.session == oSipSessionCall) {
					txtCallStatus.innerHTML = '<i>Taken off hold by remote party</i>';
				}
				break;
			}
		case 'm_bfcp_info':
			{
				if (e.session == oSipSessionCall) {
					txtCallStatus.innerHTML = 'BFCP Info: <i>' + e.description + '</i>';
				}
				break;
			}

		case 'o_ect_trying':
			{
				if (e.session == oSipSessionCall) {
					txtCallStatus.innerHTML = '<i>Call transfer in progress...</i>';
				}
				break;
			}
		case 'o_ect_accepted':
			{
				if (e.session == oSipSessionCall) {
					txtCallStatus.innerHTML = '<i>Call transfer accepted</i>';
				}
				break;
			}
		case 'o_ect_completed':
		case 'i_ect_completed':
			{
				if (e.session == oSipSessionCall) {
					txtCallStatus.innerHTML = '<i>Call transfer completed</i>';
					btnTransfer.disabled = false;
					if (oSipSessionTransferCall) {
						oSipSessionCall = oSipSessionTransferCall;
					}
					oSipSessionTransferCall = null;
				}
				break;
			}
		case 'o_ect_failed':
		case 'i_ect_failed':
			{
				if (e.session == oSipSessionCall) {
					txtCallStatus.innerHTML = '<i>Call transfer failed</i>';
					btnTransfer.disabled = false;
				}
				break;
			}
		case 'o_ect_notify':
		case 'i_ect_notify':
			{
				if (e.session == oSipSessionCall) {
					txtCallStatus.innerHTML = "<i>Call Transfer: <b>" + e.getSipResponseCode() + " " + e.description + "</b></i>";
					if (e.getSipResponseCode() >= 300) {
						if (oSipSessionCall.bHeld) {
							oSipSessionCall.resume();
						}
						btnTransfer.disabled = false;
					}
				}
				break;
			}
		case 'i_ect_requested':
			{
				if (e.session == oSipSessionCall) {
					var s_message = "Do you accept call transfer to [" + e.getTransferDestinationFriendlyName() + "]?";//FIXME
					if (confirm(s_message)) {
						txtCallStatus.innerHTML = "<i>Call transfer in progress...</i>";
						oSipSessionCall.acceptTransfer();
						break;
					}
					oSipSessionCall.rejectTransfer();
				}
				break;
			}
	}
}

// expert settings

function expertSettingsSave() {
	localStorage.setItem('mhrgl.com.expert.disable_video', cbVideoDisable.checked ? "true" : "false");
	localStorage.setItem('mhrgl.com.expert.enable_rtcweb_breaker', cbRTCWebBreaker.checked ? "true" : "false");
	if (!txtWebsocketServerUrl.disabled) {
		localStorage.setItem('mhrgl.com.expert.websocket_server_url', txtWebsocketServerUrl.value);
	}
	localStorage.setItem('mhrgl.com.expert.sip_outboundproxy_url', txtSIPOutboundProxyUrl.value);
	localStorage.setItem('mhrgl.com.expert.ice_servers', txtIceServers.value);
	localStorage.setItem('mhrgl.com.expert.bandwidth', txtBandwidth.value);
	localStorage.setItem('mhrgl.com.expert.video_size', txtSizeVideo.value);
	localStorage.setItem('mhrgl.com.expert.disable_early_ims', cbEarlyIMS.checked ? "true" : "false");
	localStorage.setItem('mhrgl.com.expert.disable_debug', cbDebugMessages.checked ? "true" : "false");
	localStorage.setItem('mhrgl.com.expert.enable_media_caching', cbCacheMediaStream.checked ? "true" : "false");
	localStorage.setItem('mhrgl.com.expert.disable_callbtn_options', cbCallButtonOptions.checked ? "true" : "false");

	txtInfo.innerHTML = '<i>Saved</i>';
}

function expertSettingsRevert() {
	cbVideoDisable.checked = (localStorage.getItem('mhrgl.com.expert.disable_video') == "true");
	cbRTCWebBreaker.checked = (localStorage.getItem('mhrgl.com.expert.enable_rtcweb_breaker') == "true");
	txtWebsocketServerUrl.value = (localStorage.getItem('mhrgl.com.expert.websocket_server_url') || "");
	txtSIPOutboundProxyUrl.value = (localStorage.getItem('mhrgl.com.expert.sip_outboundproxy_url') || "");
	txtIceServers.value = (localStorage.getItem('mhrgl.com.expert.ice_servers') || "");
	txtBandwidth.value = (localStorage.getItem('mhrgl.com.expert.bandwidth') || "");
	txtSizeVideo.value = (localStorage.getItem('mhrgl.com.expert.video_size') || "");
	cbEarlyIMS.checked = (localStorage.getItem('mhrgl.com.expert.disable_early_ims') == "true");
	cbDebugMessages.checked = (localStorage.getItem('mhrgl.com.expert.disable_debug') == "true");
	cbCacheMediaStream.checked = (localStorage.getItem('mhrgl.com.expert.enable_media_caching') == "true");
	cbCallButtonOptions.checked = (localStorage.getItem('mhrgl.com.expert.disable_callbtn_options') == "true");
}
