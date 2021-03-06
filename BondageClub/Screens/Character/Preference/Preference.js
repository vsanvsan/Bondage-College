"use strict";
var PreferenceBackground = "Sheet";
var PreferenceMessage = "";
var PreferenceColorPick = "";
var PreferenceSubscreen = "";
var PreferenceChatColorThemeSelected = "";
var PreferenceChatColorThemeList = ["Light", "Dark"];
var PreferenceChatColorThemeIndex = 0;
var PreferenceChatEnterLeaveSelected = "";
var PreferenceChatEnterLeaveList = ["Normal", "Smaller", "Hidden"];
var PreferenceChatEnterLeaveIndex = 0;
var PreferenceChatMemberNumbersSelected = "";
var PreferenceChatMemberNumbersList = ["Always", "Never", "OnMouseover"];
var PreferenceChatMemberNumbersIndex = 0;
var PreferenceSettingsSensDepList = ["Normal", "SensDepNames", "SensDepTotal"];
var PreferenceSettingsSensDepIndex = 0;
var PreferenceSettingsVolumeList = [1, 0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9];
var PreferenceSettingsVolumeIndex = 0;
var PreferenceArousalActiveList = ["Inactive", "NoMeter", "Manual", "Automatic"];
var PreferenceArousalActiveIndex = 0;
var PreferenceArousalVisibleList = ["All", "Access", "Self"];
var PreferenceArousalVisibleIndex = 0;
var PreferenceArousalActivityList = null;
var PreferenceArousalActivityIndex = 0;
var PreferenceArousalActivityFactorSelf = 0;
var PreferenceArousalActivityFactorOther = 0;

// Returns the love factor of the activity for the character (0 is horrible, 2 is normal, 4 is great)
function PreferenceGetActivityFactor(C, Type, Self) {
	var Factor = 2;
	if ((C.ArousalSettings != null) && (C.ArousalSettings.Activity != null))
		for (var P = 0; P < C.ArousalSettings.Activity.length; P++)
			if (C.ArousalSettings.Activity[P].Name == Type)
				Factor = (Self) ? C.ArousalSettings.Activity[P].Self : C.ArousalSettings.Activity[P].Other;
	if ((Factor == null) || (typeof Factor !== "number") || (Factor < 0) || (Factor > 4)) Factor = 2;
	return Factor;
}

// Sets the love factor of the activity for the character (0 is horrible, 2 is normal, 4 is great)
function PreferenceSetActivityFactor(C, Type, Self, Factor) {
	if ((C.ArousalSettings != null) && (C.ArousalSettings.Activity != null))
		for (var P = 0; P < C.ArousalSettings.Activity.length; P++)
			if (C.ArousalSettings.Activity[P].Name == Type)
				if (Self) C.ArousalSettings.Activity[P].Self = Factor;
				else C.ArousalSettings.Activity[P].Other = Factor;
}

// Returns TRUE if we must active the preference controls
function PreferenceArousalIsActive() {
	return (PreferenceArousalActiveList[PreferenceArousalActiveIndex] == "Manual") || (PreferenceArousalActiveList[PreferenceArousalActiveIndex] == "Automatic");
}

// Loads the activity factor combo boxes based on the current activity selected
function PreferenceLoadActivityFactor() {
	PreferenceArousalActivityFactorSelf = PreferenceGetActivityFactor(Player, PreferenceArousalActivityList[PreferenceArousalActivityIndex], true);
	PreferenceArousalActivityFactorOther = PreferenceGetActivityFactor(Player, PreferenceArousalActivityList[PreferenceArousalActivityIndex], false);
}

// Initialize and validates the character settings
function PreferenceInit(C) {

	// If the settings aren't set before, construct them to replicate the default behavior
	if (!C.ChatSettings) C.ChatSettings = { DisplayTimestamps: true, ColorNames: true, ColorActions: true, ColorEmotes: true };
	if (!C.VisualSettings) C.VisualSettings = { ForceFullHeight: false };
    if (!C.AudioSettings || (typeof C.AudioSettings.Volume !== "number") || (typeof C.AudioSettings.PlayBeeps !== "boolean")) C.AudioSettings = { Volume: 1, PlayBeeps: false };

	// Sets the default arousal settings
	if (!C.ArousalSettings) C.ArousalSettings = { Active: "Automatic", Visible: "Access", Activity: [] };
	if (typeof C.ArousalSettings.Active !== "string") C.ArousalSettings.Active = "Automatic";
	if (typeof C.ArousalSettings.Visible !== "string") C.ArousalSettings.Visible = "Access";
	if ((C.ArousalSettings.Activity == null) || !Array.isArray(C.ArousalSettings.Activity)) C.ArousalSettings.Activity = [];

	// Sets the default game settings
	if (!C.GameplaySettings) C.GameplaySettings = {};
	if (typeof C.GameplaySettings.SensDepChatLog !== "string") C.GameplaySettings.SensDepChatLog = "Normal";
	if (typeof C.GameplaySettings.BlindDisableExamine !== "boolean") C.GameplaySettings.BlindDisableExamine = false;
	if (typeof C.GameplaySettings.DisableAutoRemoveLogin !== "boolean") C.GameplaySettings.DisableAutoRemoveLogin = false;
	if (typeof C.GameplaySettings.EnableAfkTimer !== "boolean") C.GameplaySettings.EnableAfkTimer = true;
	
	// Validates all activities in the player preference, they must match with the game activities, default factor is 2 (normal love)
	if (Player.AssetFamily == "Female3DCG")
		for (var A = 0; A < ActivityFemale3DCG.length; A++) {
			var Found = false;
			for (var P = 0; P < C.ArousalSettings.Activity.length; P++)
				if ((C.ArousalSettings.Activity[P] != null) && (C.ArousalSettings.Activity[P].Name != null) && (ActivityFemale3DCG[A].Name == C.ArousalSettings.Activity[P].Name)) {
					Found = true;
					if ((C.ArousalSettings.Activity[P].Self == null) || (typeof C.ArousalSettings.Activity[P].Self !== "number") || (C.ArousalSettings.Activity[P].Self < 0) || (C.ArousalSettings.Activity[P].Self > 4)) C.ArousalSettings.Activity[P].Self = 2;
					if ((C.ArousalSettings.Activity[P].Other == null) || (typeof C.ArousalSettings.Activity[P].Other !== "number") || (C.ArousalSettings.Activity[P].Other < 0) || (C.ArousalSettings.Activity[P].Other > 4)) C.ArousalSettings.Activity[P].Other = 2;
				}
			if (!Found) C.ArousalSettings.Activity.push({ Name: ActivityFemale3DCG[A].Name, Self: 2, Other: 2 });
		}

	// Enables the AFK timer for the current player only
	AfkTimerSetEnabled((C.ID == 0) && C.GameplaySettings && (C.GameplaySettings.EnableAfkTimer != false));

}

// When the preference screens loads
function PreferenceLoad() {

	// Sets up the player label color
	if (!CommonIsColor(Player.LabelColor)) Player.LabelColor = "#ffffff";
	ElementCreateInput("InputCharacterLabelColor", "text", Player.LabelColor);
	PreferenceInit(Player);

	// Sets the chat themes
	PreferenceChatColorThemeIndex = (PreferenceChatColorThemeList.indexOf(Player.ChatSettings.ColorTheme) < 0) ? 0 : PreferenceChatColorThemeList.indexOf(Player.ChatSettings.ColorTheme);
	PreferenceChatEnterLeaveIndex = (PreferenceChatEnterLeaveList.indexOf(Player.ChatSettings.EnterLeave) < 0) ? 0 : PreferenceChatEnterLeaveList.indexOf(Player.ChatSettings.EnterLeave);
	PreferenceChatMemberNumbersIndex = (PreferenceChatMemberNumbersList.indexOf(Player.ChatSettings.MemberNumbers) < 0) ? 0 : PreferenceChatMemberNumbersList.indexOf(Player.ChatSettings.MemberNumbers);
	PreferenceSettingsSensDepIndex = (PreferenceSettingsSensDepList.indexOf(Player.GameplaySettings.SensDepChatLog) < 0 ) ? 0 : PreferenceSettingsSensDepList.indexOf(Player.GameplaySettings.SensDepChatLog);
    PreferenceSettingsVolumeIndex = (PreferenceSettingsVolumeList.indexOf(Player.AudioSettings.Volume) < 0) ? 0 : PreferenceSettingsVolumeList.indexOf(Player.AudioSettings.Volume);
    PreferenceArousalActiveIndex = (PreferenceArousalActiveList.indexOf(Player.ArousalSettings.Active) < 0) ? 0 : PreferenceArousalActiveList.indexOf(Player.ArousalSettings.Active);
    PreferenceArousalVisibleIndex = (PreferenceArousalVisibleList.indexOf(Player.ArousalSettings.Visible) < 0) ? 0 : PreferenceArousalVisibleList.indexOf(Player.ArousalSettings.Visible);
	PreferenceChatColorThemeSelected = PreferenceChatColorThemeList[PreferenceChatColorThemeIndex];
	PreferenceChatEnterLeaveSelected = PreferenceChatEnterLeaveList[PreferenceChatEnterLeaveIndex];
	PreferenceChatMemberNumbersSelected = PreferenceChatMemberNumbersList[PreferenceChatMemberNumbersIndex];

	// Prepares the activity list
	PreferenceArousalActivityList = [];
	if (Player.AssetFamily == "Female3DCG")
		for (var A = 0; A < ActivityFemale3DCG.length; A++)
			PreferenceArousalActivityList.push(ActivityFemale3DCG[A].Name);
	PreferenceArousalActivityIndex = 0;
	PreferenceLoadActivityFactor();

}

// Run the preference screen
function PreferenceRun() {
	
	// If a subscreen is active, draw that instead
	if (PreferenceSubscreen == "Chat") return PreferenceSubscreenChatRun();
	if (PreferenceSubscreen == "Audio") return PreferenceSubscreenAudioRun();
	if (PreferenceSubscreen == "Arousal") return PreferenceSubscreenArousalRun();

	// Draw the online preferences
	MainCanvas.textAlign = "left";
	DrawText(TextGet("Preferences"), 500, 125, "Black", "Gray");
    if (PreferenceMessage != "") DrawText(TextGet(PreferenceMessage), 865, 125, "Red", "Black");
	DrawText(TextGet("CharacterLabelColor"), 500, 225, "Black", "Gray");
	ElementPosition("InputCharacterLabelColor", 990, 212, 250);
	if (CommonIsColor(ElementValue("InputCharacterLabelColor"))) document.getElementById("InputCharacterLabelColor").style.color = ElementValue("InputCharacterLabelColor");
	else document.getElementById("InputCharacterLabelColor").style.color = Player.LabelColor;
	document.getElementById("InputCharacterLabelColor").style.backgroundColor = "#000000";
	DrawButton(1140, 187, 65, 65, "", "White", "Icons/Color.png");
	DrawButton(500, 280, 90, 90, "", "White", "Icons/Next.png");
	DrawText(TextGet("ItemPermission") + " " + TextGet("PermissionLevel" + Player.ItemPermission.toString()), 615, 325, "Black", "Gray");
	DrawText(TextGet("SensDepSetting"), 800, 428, "Black", "Gray");
	
	// Checkboxes
	DrawCheckbox(500, 472, 64, 64, TextGet("BlindDisableExamine"), Player.GameplaySettings.BlindDisableExamine);
	DrawCheckbox(500, 552, 64, 64, TextGet("DisableAutoRemoveLogin"), Player.GameplaySettings.DisableAutoRemoveLogin);
	DrawCheckbox(500, 632, 64, 64, TextGet("EnableAfkTimer"), Player.GameplaySettings.EnableAfkTimer);
	DrawCheckbox(500, 712, 64, 64, TextGet("ForceFullHeight"), Player.VisualSettings.ForceFullHeight);

	MainCanvas.textAlign = "center";
	DrawBackNextButton(500, 392, 250, 64, TextGet(Player.GameplaySettings.SensDepChatLog), "White", "",
		() => TextGet(PreferenceSettingsSensDepList[(PreferenceSettingsSensDepIndex + PreferenceSettingsSensDepList.length - 1) % PreferenceSettingsSensDepList.length]),
		() => TextGet(PreferenceSettingsSensDepList[(PreferenceSettingsSensDepIndex + 1) % PreferenceSettingsSensDepList.length]));

	// Draw the player & controls
	DrawCharacter(Player, 50, 50, 0.9);
	DrawButton(1815, 75, 90, 90, "", "White", "Icons/Exit.png");
	if (PreferenceColorPick != "") {
		ColorPickerDraw(1250, 185, 675, 830, document.getElementById(PreferenceColorPick));
	} else {
    	ColorPickerHide();
		DrawButton(1815, 190, 90, 90, "", "White", "Icons/Chat.png");
		DrawButton(1815, 305, 90, 90, "", "White", "Icons/Audio.png");
		DrawButton(1815, 420, 90, 90, "", "White", "Icons/Arousal.png");
	}
}

// When the user clicks in the preference screen
function PreferenceClick() {

	// If a subscreen is active, process that instead
	if (PreferenceSubscreen == "Chat") return PreferenceSubscreenChatClick();
	if (PreferenceSubscreen == "Audio") return PreferenceSubscreenAudioClick();
	if (PreferenceSubscreen == "Arousal") return PreferenceSubscreenArousalClick();

	// If the user clicks on "Exit"
	if ((MouseX >= 1815) && (MouseX < 1905) && (MouseY >= 75) && (MouseY < 165) && (PreferenceColorPick == "")) PreferenceExit();

	// If the user clicks on the chat settings button
	if ((MouseX >= 1815) && (MouseX < 1905) && (MouseY >= 190) && (MouseY < 280) && (PreferenceColorPick == "")) {
		ElementRemove("InputCharacterLabelColor");
		PreferenceSubscreen = "Chat";
	}

	// If the user clicks on the audio settings button
	if ((MouseX >= 1815) && (MouseX < 1905) && (MouseY >= 305) && (MouseY < 395) && (PreferenceColorPick == "")) {
		ElementRemove("InputCharacterLabelColor");
		PreferenceSubscreen = "Audio";
	}

	// If the user clicks on the arousal settings button
	if ((MouseX >= 1815) && (MouseX < 1905) && (MouseY >= 420) && (MouseY < 510) && (PreferenceColorPick == "")) {
		ElementRemove("InputCharacterLabelColor");
		PreferenceSubscreen = "Arousal";
	}
	
	// If we must change the restrain permission level
	if ((MouseX >= 500) && (MouseX < 590) && (MouseY >= 280) && (MouseY < 370)) {
		Player.ItemPermission++;
		if (Player.ItemPermission > 5) Player.ItemPermission = 0;
	}

	// If we must show/hide/use the color picker
	if ((MouseX >= 1140) && (MouseX < 1205) && (MouseY >= 187) && (MouseY < 252)) PreferenceColorPick = (PreferenceColorPick != "InputCharacterLabelColor") ? "InputCharacterLabelColor" : "";
	if ((MouseX >= 1815) && (MouseX < 1905) && (MouseY >= 75) && (MouseY < 165) && (PreferenceColorPick != "")) PreferenceColorPick = "";

    // If we must change audio gameplay or visual settings
	if ((MouseX >= 500) && (MouseX < 750) && (MouseY >= 392) && (MouseY < 456)) {
		if (MouseX <= 625) PreferenceSettingsSensDepIndex = (PreferenceSettingsSensDepList.length + PreferenceSettingsSensDepIndex - 1) % PreferenceSettingsSensDepList.length;
		else PreferenceSettingsSensDepIndex = (PreferenceSettingsSensDepIndex + 1) % PreferenceSettingsSensDepList.length;
		Player.GameplaySettings.SensDepChatLog = PreferenceSettingsSensDepList[PreferenceSettingsSensDepIndex];
	}

	// Preference check boxes
	if (CommonIsClickAt(500, 472, 64, 64)) Player.GameplaySettings.BlindDisableExamine = !Player.GameplaySettings.BlindDisableExamine;
	if (CommonIsClickAt(500, 552, 64, 64)) Player.GameplaySettings.DisableAutoRemoveLogin = !Player.GameplaySettings.DisableAutoRemoveLogin;
	if (CommonIsClickAt(500, 632, 64, 64)) {
		Player.GameplaySettings.EnableAfkTimer = !Player.GameplaySettings.EnableAfkTimer;
		AfkTimerSetEnabled(Player.GameplaySettings.EnableAfkTimer);
	}
	if (CommonIsClickAt(500, 712, 64, 64)) Player.VisualSettings.ForceFullHeight = !Player.VisualSettings.ForceFullHeight;

}

// When the user exit the preference screen, we push the data back to the server
function PreferenceExit() {
	if (CommonIsColor(ElementValue("InputCharacterLabelColor"))) {
		Player.LabelColor = ElementValue("InputCharacterLabelColor");
		var P = {
			ItemPermission: Player.ItemPermission,
			LabelColor: Player.LabelColor,
			ChatSettings: Player.ChatSettings,
			VisualSettings: Player.VisualSettings,
			AudioSettings: Player.AudioSettings,
			GameplaySettings: Player.GameplaySettings,
			ArousalSettings: Player.ArousalSettings
		};
		console.log(P);
		ServerSend("AccountUpdate", P);
		PreferenceMessage = "";
		ElementRemove("InputCharacterLabelColor");
		CommonSetScreen("Character", "InformationSheet");
	} else PreferenceMessage = "ErrorInvalidColor";
}

// Redirected to from the main Run function if the player is in the audio settings subscreen
function PreferenceSubscreenAudioRun() {
	DrawCharacter(Player, 50, 50, 0.9);
	MainCanvas.textAlign = "left";
	DrawText(TextGet("AudioPreferences"), 500, 125, "Black", "Gray");
	DrawText(TextGet("AudioVolume"), 800, 225, "Black", "Gray");
	DrawText(TextGet("AudioPlayBeeps"), 600, 305, "Black", "Gray");
    DrawButton(500, 272, 64, 64, "", "White", (Player.AudioSettings && Player.AudioSettings.PlayBeeps) ? "Icons/Checked.png" : "");
    DrawText(TextGet("AudioPlayItem"), 600, 385, "Black", "Gray");
	DrawButton(500, 352, 64, 64, "", "White", (Player.AudioSettings && Player.AudioSettings.PlayItem) ? "Icons/Checked.png" : "");
	MainCanvas.textAlign = "center";
    DrawBackNextButton(500, 193, 250, 64, Player.AudioSettings.Volume * 100 + "%", "White", "",
        () => PreferenceSettingsVolumeList[(PreferenceSettingsVolumeIndex + PreferenceSettingsVolumeList.length - 1) % PreferenceSettingsVolumeList.length] * 100 + "%",
        () => PreferenceSettingsVolumeList[(PreferenceSettingsVolumeIndex + 1) % PreferenceSettingsVolumeList.length] * 100 + "%");
	DrawButton(1815, 75, 90, 90, "", "White", "Icons/Exit.png");
}

// Redirected to from the main Run function if the player is in the chat settings subscreen
function PreferenceSubscreenChatRun() {
	MainCanvas.textAlign = "left";
	DrawText(TextGet("ChatPreferences"), 500, 125, "Black", "Gray");
	DrawText(TextGet("ColorTheme"), 500, 225, "Black", "Gray");
	DrawText(TextGet("EnterLeaveStyle"), 500, 325, "Black", "Gray");
	DrawText(TextGet("DisplayMemberNumbers"), 500, 425, "Black", "Gray");
	DrawText(TextGet("DisplayTimestamps"), 600, 525, "Black", "Gray");
	DrawText(TextGet("ColorNames"), 600, 625, "Black", "Gray");
	DrawText(TextGet("ColorActions"), 600, 725, "Black", "Gray");
	DrawText(TextGet("ColorEmotes"), 600, 825, "Black", "Gray");
	MainCanvas.textAlign = "center";
	DrawBackNextButton(1000, 190, 350, 70, TextGet(PreferenceChatColorThemeSelected), "White", "",
		() => TextGet((PreferenceChatColorThemeIndex == 0) ? PreferenceChatColorThemeList[PreferenceChatColorThemeList.length - 1] : PreferenceChatColorThemeList[PreferenceChatColorThemeIndex - 1]),
		() => TextGet((PreferenceChatColorThemeIndex >= PreferenceChatColorThemeList.length - 1) ? PreferenceChatColorThemeList[0] : PreferenceChatColorThemeList[PreferenceChatColorThemeIndex + 1]));
	DrawBackNextButton(1000, 290, 350, 70, TextGet(PreferenceChatEnterLeaveSelected), "White", "",
		() => TextGet((PreferenceChatEnterLeaveIndex == 0) ? PreferenceChatEnterLeaveList[PreferenceChatEnterLeaveList.length - 1] : PreferenceChatEnterLeaveList[PreferenceChatEnterLeaveIndex - 1]),
		() => TextGet((PreferenceChatEnterLeaveIndex >= PreferenceChatEnterLeaveList.length - 1) ? PreferenceChatEnterLeaveList[0] : PreferenceChatEnterLeaveList[PreferenceChatEnterLeaveIndex + 1]));
	DrawBackNextButton(1000, 390, 350, 70, TextGet(PreferenceChatMemberNumbersSelected), "White", "",
		() => TextGet((PreferenceChatMemberNumbersIndex == 0) ? PreferenceChatMemberNumbersList[PreferenceChatMemberNumbersList.length - 1] : PreferenceChatMemberNumbersList[PreferenceChatMemberNumbersIndex - 1]),
		() => TextGet((PreferenceChatMemberNumbersIndex >= PreferenceChatMemberNumbersList.length - 1) ? PreferenceChatMemberNumbersList[0] : PreferenceChatMemberNumbersList[PreferenceChatMemberNumbersIndex + 1]));
	DrawButton(500, 492, 64, 64, "", "White", (Player.ChatSettings && Player.ChatSettings.DisplayTimestamps) ? "Icons/Checked.png" : "");
	DrawButton(500, 592, 64, 64, "", "White", (Player.ChatSettings && Player.ChatSettings.ColorNames) ? "Icons/Checked.png" : "");
	DrawButton(500, 692, 64, 64, "", "White", (Player.ChatSettings && Player.ChatSettings.ColorActions) ? "Icons/Checked.png" : "");
	DrawButton(500, 792, 64, 64, "", "White", (Player.ChatSettings && Player.ChatSettings.ColorEmotes) ? "Icons/Checked.png" : "");
	DrawButton(1815, 75, 90, 90, "", "White", "Icons/Exit.png");
	DrawCharacter(Player, 50, 50, 0.9);
}

// Redirected to from the main Run function if the player is in the arousal settings subscreen
function PreferenceSubscreenArousalRun() {

	// Draws the main labels and player
	DrawCharacter(Player, 50, 50, 0.9);
	MainCanvas.textAlign = "left";
	DrawText(TextGet("ArousalPreferences"), 500, 125, "Black", "Gray");
	DrawText(TextGet("ArousalActive"), 500, 225, "Black", "Gray");
	
	// The other controls are only drawn if the arousal is active
	if (PreferenceArousalIsActive()) {
		
		// Draws the label on the left side
		DrawText(TextGet("ArousalVisible"), 1240, 225, "Black", "Gray");
		DrawText(TextGet("ArousalActivity"), 500, 425, "Black", "Gray");
		DrawText(TextGet("ArousalActivityLoveSelf"), 500, 525, "Black", "Gray");
		DrawText(TextGet("ArousalActivityLoveOther"), 1255, 525, "Black", "Gray");
		
		// The zones can be drawn on the character
		if (Player.FocusGroup != null) {
			DrawText(TextGet("ArousalZone" + Player.FocusGroup.Name) + " - " + TextGet("ArousalSelectErogenousZones"), 500, 725, "Black", "Gray");
		}
		else DrawText(TextGet("ArousalSelectErogenousZones"), 500, 725, "Black", "Gray");

		// Draws the sub-selection controls
		MainCanvas.textAlign = "center";
		DrawBackNextButton(1405, 193, 500, 64, TextGet("ArousalVisible" + PreferenceArousalVisibleList[PreferenceArousalVisibleIndex]), "White", "", () => "", () => "");
		DrawBackNextButton(850, 393, 500, 64, TextGet("ArousalActivityType" + PreferenceArousalActivityList[PreferenceArousalActivityIndex]), "White", "", () => "", () => "");
		DrawBackNextButton(850, 493, 300, 64, TextGet("ArousalActivityLove" + PreferenceArousalActivityFactorSelf), "White", "", () => "", () => "");
		DrawBackNextButton(1605, 493, 300, 64, TextGet("ArousalActivityLove" + PreferenceArousalActivityFactorOther), "White", "", () => "", () => "");

	}

	// We always draw the active control
	MainCanvas.textAlign = "center";
	DrawBackNextButton(700, 193, 500, 64, TextGet("ArousalActive" + PreferenceArousalActiveList[PreferenceArousalActiveIndex]), "White", "", () => "", () => "");
	DrawButton(1815, 75, 90, 90, "", "White", "Icons/Exit.png");

}

// When the user clicks in the audio preference subscreen
function PreferenceSubscreenAudioClick() {

	// If the user clicked the exit icon to return to the main screen
	if ((MouseX >= 1815) && (MouseX < 1905) && (MouseY >= 75) && (MouseY < 165) && (PreferenceColorPick == "")) {
		PreferenceSubscreen = "";
		ElementCreateInput("InputCharacterLabelColor", "text", Player.LabelColor);
	}

	// Volume increase/decrease control
    if ((MouseX >= 500) && (MouseX < 750) && (MouseY >= 193) && (MouseY < 257)) {
        if (MouseX <= 625) PreferenceSettingsVolumeIndex = (PreferenceSettingsVolumeList.length + PreferenceSettingsVolumeIndex - 1) % PreferenceSettingsVolumeList.length;
        else PreferenceSettingsVolumeIndex = (PreferenceSettingsVolumeIndex + 1) % PreferenceSettingsVolumeList.length;
        Player.AudioSettings.Volume = PreferenceSettingsVolumeList[PreferenceSettingsVolumeIndex];
    }

	// Individual audio check-boxes
	if ((MouseX >= 500) && (MouseX < 564)) {
		if ((MouseY >= 272) && (MouseY < 336)) Player.AudioSettings.PlayBeeps = !Player.AudioSettings.PlayBeeps;
		if ((MouseY >= 352) && (MouseY < 416)) Player.AudioSettings.PlayItem = !Player.AudioSettings.PlayItem;
	}

}

// Redirected to from the main Click function if the player is in the chat settings subscreen
function PreferenceSubscreenChatClick() {

	// If the user clicked one of the check-boxes
	if ((MouseX >= 500) && (MouseX < 564)) {
		if ((MouseY >= 492) && (MouseY < 556)) Player.ChatSettings.DisplayTimestamps = !Player.ChatSettings.DisplayTimestamps;
		if ((MouseY >= 592) && (MouseY < 656)) Player.ChatSettings.ColorNames = !Player.ChatSettings.ColorNames;
		if ((MouseY >= 692) && (MouseY < 756)) Player.ChatSettings.ColorActions = !Player.ChatSettings.ColorActions;
		if ((MouseY >= 792) && (MouseY < 856)) Player.ChatSettings.ColorEmotes = !Player.ChatSettings.ColorEmotes;
	}

	// If the user used one of the BackNextButtons
	if ((MouseX >= 1000) && (MouseX < 1350) && (MouseY >= 190) && (MouseY < 270)) {
		if (MouseX <= 1175) PreferenceChatColorThemeIndex = (PreferenceChatColorThemeIndex <= 0) ? PreferenceChatColorThemeList.length - 1 : PreferenceChatColorThemeIndex - 1;
		else PreferenceChatColorThemeIndex = (PreferenceChatColorThemeIndex >= PreferenceChatColorThemeList.length - 1) ? 0 : PreferenceChatColorThemeIndex + 1;
		PreferenceChatColorThemeSelected = PreferenceChatColorThemeList[PreferenceChatColorThemeIndex];
		Player.ChatSettings.ColorTheme = PreferenceChatColorThemeSelected;
	}
	if ((MouseX >= 1000) && (MouseX < 1350) && (MouseY >= 290) && (MouseY < 370)) {
		if (MouseX <= 1175) PreferenceChatEnterLeaveIndex = (PreferenceChatEnterLeaveIndex <= 0) ? PreferenceChatEnterLeaveList.length - 1 : PreferenceChatEnterLeaveIndex - 1;
		else PreferenceChatEnterLeaveIndex = (PreferenceChatEnterLeaveIndex >= PreferenceChatEnterLeaveList.length - 1) ? 0 : PreferenceChatEnterLeaveIndex + 1;
		PreferenceChatEnterLeaveSelected = PreferenceChatEnterLeaveList[PreferenceChatEnterLeaveIndex];
		Player.ChatSettings.EnterLeave = PreferenceChatEnterLeaveSelected;
	}
	if ((MouseX >= 1000) && (MouseX < 1350) && (MouseY >= 390) && (MouseY < 470)) {
		if (MouseX <= 1175) PreferenceChatMemberNumbersIndex = (PreferenceChatMemberNumbersIndex <= 0) ? PreferenceChatMemberNumbersList.length - 1 : PreferenceChatMemberNumbersIndex - 1;
		else PreferenceChatMemberNumbersIndex = (PreferenceChatMemberNumbersIndex >= PreferenceChatMemberNumbersList.length - 1) ? 0 : PreferenceChatMemberNumbersIndex + 1;
		PreferenceChatMemberNumbersSelected = PreferenceChatMemberNumbersList[PreferenceChatMemberNumbersIndex];
		Player.ChatSettings.MemberNumbers = PreferenceChatMemberNumbersSelected;
	}

	// If the user clicked the exit icon to return to the main screen
	if ((MouseX >= 1815) && (MouseX < 1905) && (MouseY >= 75) && (MouseY < 165) && (PreferenceColorPick == "")) {
		PreferenceSubscreen = "";
		ElementCreateInput("InputCharacterLabelColor", "text", Player.LabelColor);
	}

}

// When the user clicks in the arousal preference subscreen
function PreferenceSubscreenArousalClick() {

	// If the user clicked the exit icon to return to the main screen
	if ((MouseX >= 1815) && (MouseX < 1905) && (MouseY >= 75) && (MouseY < 165) && (PreferenceColorPick == "")) {
		PreferenceSubscreen = "";
		ElementCreateInput("InputCharacterLabelColor", "text", Player.LabelColor);
	}

	// Arousal active control
    if ((MouseX >= 700) && (MouseX < 1200) && (MouseY >= 193) && (MouseY < 257)) {
        if (MouseX <= 950) PreferenceArousalActiveIndex = (PreferenceArousalActiveList.length + PreferenceArousalActiveIndex - 1) % PreferenceArousalActiveList.length;
        else PreferenceArousalActiveIndex = (PreferenceArousalActiveIndex + 1) % PreferenceArousalActiveList.length;
        Player.ArousalSettings.Active = PreferenceArousalActiveList[PreferenceArousalActiveIndex];
    }

	// If the arousal is active, we allow more controls
	if (PreferenceArousalIsActive()) {

		// Arousal visible control
		if ((MouseX >= 1405) && (MouseX < 1905) && (MouseY >= 193) && (MouseY < 257)) {
			if (MouseX <= 1655) PreferenceArousalVisibleIndex = (PreferenceArousalVisibleList.length + PreferenceArousalVisibleIndex - 1) % PreferenceArousalVisibleList.length;
			else PreferenceArousalVisibleIndex = (PreferenceArousalVisibleIndex + 1) % PreferenceArousalVisibleList.length;
			Player.ArousalSettings.Visible = PreferenceArousalVisibleList[PreferenceArousalVisibleIndex];
		}

		// Arousal activity control
		if ((MouseX >= 850) && (MouseX < 1350) && (MouseY >= 393) && (MouseY < 457)) {
			if (MouseX <= 1100) PreferenceArousalActivityIndex = (PreferenceArousalActivityList.length + PreferenceArousalActivityIndex - 1) % PreferenceArousalActivityList.length;
			else PreferenceArousalActivityIndex = (PreferenceArousalActivityIndex + 1) % PreferenceArousalActivityList.length;
			PreferenceLoadActivityFactor();
		}

		// Arousal activity love on self control
		if ((MouseX >= 850) && (MouseX < 1150) && (MouseY >= 493) && (MouseY < 557)) {
			if (MouseX <= 1000) PreferenceArousalActivityFactorSelf = (5 + PreferenceArousalActivityFactorSelf - 1) % 5;
			else PreferenceArousalActivityFactorSelf = (PreferenceArousalActivityFactorSelf + 1) % 5;
			PreferenceSetActivityFactor(Player, PreferenceArousalActivityList[PreferenceArousalActivityIndex], true, PreferenceArousalActivityFactorSelf);
		}

		// Arousal activity love on other control
		if ((MouseX >= 1605) && (MouseX < 1905) && (MouseY >= 493) && (MouseY < 557)) {
			if (MouseX <= 1755) PreferenceArousalActivityFactorOther = (5 + PreferenceArousalActivityFactorOther - 1) % 5;
			else PreferenceArousalActivityFactorOther = (PreferenceArousalActivityFactorOther + 1) % 5;
			PreferenceSetActivityFactor(Player, PreferenceArousalActivityList[PreferenceArousalActivityIndex], false, PreferenceArousalActivityFactorOther);
		}
	
	}
		
}

// Return true if sensory deprivation is active
function PreferenceIsPlayerInSensDep() {
	return (Player.GameplaySettings && ((Player.GameplaySettings.SensDepChatLog == "SensDepNames") || (Player.GameplaySettings.SensDepChatLog == "SensDepTotal")) && (Player.Effect.indexOf("DeafHeavy") >= 0) && (Player.Effect.indexOf("BlindHeavy") >= 0));
}