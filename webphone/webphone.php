<div id='divKeyPad' class='span2 well div-keypad' style=" display:table-cell;">
	<table>
		<tr>
			<td><input type="button" style="width: 33%" class="btn" value="1" onclick="sipSendDTMF('1');" /><input type="button" style="width: 33%" class="btn" value="2" onclick="sipSendDTMF('2');" /><input type="button" style="width: 33%" class="btn" value="3" onclick="sipSendDTMF('3');" /></td>
			<td><input type="button" style="width: 33%" class="btn" value="4" onclick="sipSendDTMF('4');" /><input type="button" style="width: 33%" class="btn" value="5" onclick="sipSendDTMF('5');" /><input type="button" style="width: 33%" class="btn" value="6" onclick="sipSendDTMF('6');" /></td>
			<td><input type="button" style="width: 33%" class="btn" value="7" onclick="sipSendDTMF('7');" /><input type="button" style="width: 33%" class="btn" value="8" onclick="sipSendDTMF('8');" /><input type="button" style="width: 33%" class="btn" value="9" onclick="sipSendDTMF('9');" /></td>
			<td><input type="button" style="width: 33%" class="btn" value="*" onclick="sipSendDTMF('*');" /><input type="button" style="width: 33%" class="btn" value="0" onclick="sipSendDTMF('0');" /><input type="button" style="width: 33%" class="btn" value="#" onclick="sipSendDTMF('#');" /></td>
		</tr>
	</table>
</div>

<div id="divCallCtrl" class="span10 well" style="display:table-cell;">
	            
	<table>
	
		<tr>	
		
			<td colspan="9">
				<input type="text" style="width:100%; height:30" id="txtPhoneNumber" value="" placeholder="Enter phone number to call" />
			</td>
		
			<td>
				<div id="divBtnCallGroup" class="btn-group">
					<button id="btnCall" disabled style="width:100%; height:100%" class="btn btn-primary" data-toggle="dropdown">Call</button>
				</div>
			</td>
			
			<td>
				<div class="btn-group">
					<input type="button" id="btnHangUp" style="width:100%; height:100%" class="btn btn-primary" value="HangUp" onclick='sipHangUp();' disabled />
				</div>
			</td>

		
			<td>
				<input type="button" class="btn btn-primary" style="width:100%; height:100%" id="btnMute" value="Mute" onclick='sipToggleMute();' />
			</td>
			
			<td>
				<input type="button" class="btn btn-primary" style="width:100%; height:100%" id="btnHoldResume" value="Hold" onclick='sipToggleHoldResume();' />
			</td>
			
			<td>
				<input type="button" class="btn btn-primary" style="width:100%; height:100%" id="btnTransfer" value="Transfer" onclick='sipTransfer();' /> 
			</td>
			
			<td colspan="9">
				<label align="center" id="txtRegStatus" > </label> <label align="center" id="txtCallStatus"> </label>
			</td>	
			
		</tr>
		
	</table>
	
</div>



    <!-- Call button options -->
<ul id="ulCallOptions" class="dropdown-menu" style="visibility:hidden">
	<li><a href="#" onclick='sipCall("call-audio");'>Audio</a></li>
	<li><a href="#" onclick='uiDisableCallOptions();'><b>Disable these options</b></a></li>
</ul>

<!-- Le javascript
================================================== -->
<!-- Placed at the end of the document so the pages load faster -->    
<script src="webphone/app.js" type="text/javascript"> </script>
<script src="webphone/SIPml-api.js" type="text/javascript"> </script>

<!-- Audios -->
<audio id="audio_remote" autoplay="autoplay"> </audio>
<audio id="ringtone" loop src="webphone/sounds/ringtone.wav"> </audio>
<audio id="ringbacktone" loop src="webphone/sounds/ringbacktone.wav"> </audio>
<audio id="dtmfTone" src="webphone/sounds/dtmf.wav"> </audio>
