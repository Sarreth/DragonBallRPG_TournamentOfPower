/*:
*
* @plugindesc Dragon Ball Utils plugin version 2.5
* Assembly with some utilities for the Dragon Ball Tournament Of Power game.
* See help for indications about Plugin Command.
*
* @param Fusion Duration
* @desc Number of turns before fusion expire
* @default 6
*
*
* @author Sarreth
*
* @help
* ============================================================================
* Notetags
* ============================================================================
*
* The following are some notetags you can use with this plugin
*
* Actor Notetags:
*   <PotaraFusion With x: Result y>
*   This actor will be able to fuse permanently with actor x resulting in y actor
*
*   <TempFusion With x: Result y>
*   This actor will be able to fuse for some time with actor x resulting in y actor
*
* Class Notetags :
*   <Nextclass: x Level y>
*	This class can evolve into class x if it has met level y as requirement.
*
* ============================================================================
* Plugin Commands
* ============================================================================
*
* Included in this mod are multiple Plugin Commands to help assist you with
* dragon ball system.*
*
* EvalActorLevel
*  - Allow to check on class level for each actor and try to evolve them if requirements are met
*
* PotaraFusion 
*  - Allow to fuse two characters depending on the PotaraFusion tags
*
* TempFusion 
*  - Allow to fuse two characters in fight depending on the TempFusion tags
*
*
*/
var Sarreth = Sarreth || {};

Sarreth.Parameters = PluginManager.parameters('KT_ClassSwitchCore');
Sarreth.Param = Sarreth.Param || {};

Sarreth.Param.FusionDuration = eval(String(Sarreth.Parameters['Fusion Duration']));

var fusionResultIds  = [];
var fusionCallerIds  = [];
var fusionReceiverIds  = [];
var fusionCountdown = [];

var _Game_Interpreter_pluginCommand = Game_Interpreter.prototype.pluginCommand;
  Game_Interpreter.prototype.pluginCommand = function(command, args) {
    _Game_Interpreter_pluginCommand.call(this, command, args);
	
	console.log("Commande appelée " + command );
     if(command === 'EvalActorLevel'){
      Sarreth.Util.checkGroupActorLevel();
    }
	
     if(command === 'PotaraFusion'){
      Sarreth.Util.checkPotaraFusion();
    }
	
     if(command === 'TempFusion'){
      Sarreth.Util.checkTempFusion();
    }
  };
  
  
//=============================================================================
// Utils
//=============================================================================

Sarreth.Util = Sarreth.Util || {};

Sarreth.Util.checkGroupActorLevel = function() 
{	
	console.log("Méthode checkActorLevel avec " + $gameParty.members().length + " actors");  
	var noteClass = /<(?:NEXTCLASS):[ ](\d+)[ ](?:LEVEL)[ ](\d+)>/i;

	for (var n = 0; n < $gameParty.members().length; n++) 
	{		
		Sarreth.Util.checkActorLevel($gameParty.members()[n]._baseActorId);
	}
};

Sarreth.Util.checkActorLevel = function(actorId) 
{
	var noteClass = /<(?:NEXTCLASS):[ ](\d+)[ ](?:LEVEL)[ ](\d+)>/i;
	
	var actor = $gameActors.actor(actorId);
	var obj = actor.currentClass();
	console.log("Actor " + actor + " | Class : " + obj);
	var notedata = obj.note.split(/[\r\n]+/);
	var nextClassId = -1;
	var requiredLevel = -1;

	console.log("debut de boucle avec notadata length :" + notedata.length);
	for (var i = 0; i < notedata.length; i++) 
	{		
	  var line = notedata[i];
	  console.log(line);
	  
	  if (line.match(noteClass))
	  {
		console.log("Line match:");
		nextClassId = parseInt(RegExp.$1);
		requiredLevel = parseInt(RegExp.$2);
		console.log("ecriture des variables : classe suivante " + nextClassId + " requis " + requiredLevel);
	  }else
	  {
		console.log("match failed");
	  }
	}
	if(nextClassId >= 0 && requiredLevel > 0 && actor.level >= requiredLevel)
	{
		actor.changeClass(nextClassId, false);
	}
};

Sarreth.Util.onBattleEnd = function()
{
	var toRemove = [];
	
	for(var fusionIndex = 0; fusionIndex < fusionResultIds.length; fusionIndex++)
	{
		if(fusionCountdown[fusionIndex] > 0)
		{
			$gameParty.addActor(fusionCallerIds[fusionIndex]);
			$gameParty.addActor(fusionReceiverIds[fusionIndex]);
			$gameParty.removeActor(fusionResultIds[fusionIndex]);
			
			toRemove.push(fusionIndex);
		}else
		{
			fusionCountdown[fusionIndex]--;
		}
	}
	
	for(var i=0; i < toRemove.length; i++)
	{
		fusionCountdown.splice(toRemove[i],1);
		fusionCallerIds.splice(toRemove[i],1);
		fusionReceiverIds.splice(toRemove[i],1);
		fusionResultIds.splice(toRemove[i],1);
	}
	
	toRemove = undefined; 
}

Sarreth.Util.BattleManager_processDefeat = BattleManager.processDefeat;
BattleManager.processDefeat = function () 
{
	Sarreth.Util.onBattleEnd();
	Sarreth.Util.BattleManager_processDefeat.call(this);
};

Sarreth.Util.BattleManager_processVictory = BattleManager.processVictory;
BattleManager.processVictory = function () 
{	
	Sarreth.Util.onBattleEnd();
	Sarreth.Util.BattleManager_processVictory.call(this);
};

Sarreth.Util.BattleManager_updateTurnEnd = BattleManager.updateTurnEnd;
    BattleManager.updateTurnEnd = function () 
{
	Sarreth.Util.BattleManager_updateTurnEnd.call(this);
	var toRemove = [];
	
	for(var fusionIndex = 0; fusionIndex < fusionResultIds.length; fusionIndex++)
	{
		if(fusionCountdown[fusionIndex] == 0)
		{
			$gameParty.addActor(fusionCallerIds[fusionIndex]);
			$gameParty.addActor(fusionReceiverIds[fusionIndex]);
			$gameParty.removeActor(fusionResultIds[fusionIndex]);
			
			toRemove.push(fusionIndex);
		}else
		{
			fusionCountdown[fusionIndex]--;
		}
	}
	
	for(var i=0; i < toRemove.length; i++)
	{
		fusionCountdown.splice(toRemove[i],1);
		fusionCallerIds.splice(toRemove[i],1);
		fusionReceiverIds.splice(toRemove[i],1);
		fusionResultIds.splice(toRemove[i],1);
	}
	
	toRemove = undefined; 
};

Sarreth.Util.checkTempFusion = function() 
{	
	console.log("Méthode checkPotaraFusion avec " + $gameParty.members().length + " actors");  
	var noteClass = /<(?:TEMPFUSION WITH)[ ](\d+):[ ](?:RESULT)[ ](\d+)>/i;
	var callerId = $gameVariables.value(1);
	var receiverId = $gameVariables.value(2);	
	
	$gameVariables.setValue(1,0);
	$gameVariables.setValue(2,0);
	
	console.log("Caller Id " + callerId + " | Receiver id " + receiverId);  
	var caller = $dataActors[callerId];
	console.log("Caller " + caller + " | Note " + caller.note);  
	var notedata = caller.note.split(/[\r\n]+/);
	var fusionCandidate = -1;
	var resultActorId = -1;
	
	for (var i = 0; i < notedata.length; i++) 
	{		
	  var line = notedata[i];
	  console.log(line);
	  
	  if (line.match(noteClass))
	  {
		console.log("Line match:");
		fusionCandidate = parseInt(RegExp.$1);
		resultActorId = parseInt(RegExp.$2);
		console.log("ecriture des variables : actor eligible " + fusionCandidate + " fusion " + resultActorId);
		
		if(fusionCandidate != receiverId)
		{
			fusionCandidate = -1;
			resultActorId = -1;
		}
		
	  }else
	  {
		console.log("match failed");
	  }
	}
	
	if(fusionCandidate != receiverId || fusionCandidate <=0 || resultActorId <=0)
	{	
		//Display screen
		return;
	}
	
	var receiverActor = $dataActors[receiverId];
	
	$gameParty.addActor(resultActorId);
	
	var callerLevel = Sarreth.Util.getActorTotalLevel(callerId);	
	var receiverLevel = Sarreth.Util.getActorTotalLevel(callerId);
	
	var targetLevel = callerLevel + receiverLevel;
	
	Sarreth.Util.addLevelToActorAndCheckForEvol(resultActorId, targetLevel);
	
	console.log("Caller " + caller.name + " | Receiver " + receiverActor.name + " | Fused " + $gameActors.actor(resultActorId).name);  
	
	$gameParty.removeActor(receiverId);
	$gameParty.removeActor(callerId);
	
	fusionReceiverIds.push(receiverId);
	fusionCallerIds.push(callerId);
	fusionResultIds.push(resultActorId);
	fusionCountdown.push(Sarreth.Param.FusionDuration);
};

Sarreth.Util.checkPotaraFusion = function() 
{	
	console.log("Méthode checkPotaraFusion avec " + $gameParty.members().length + " actors");  
	var noteClass = /<(?:POTARAFUSION WITH)[ ](\d+):[ ](?:RESULT)[ ](\d+)>/i;
	var callerId = $gameVariables.value(1);
	var receiverId = $gameVariables.value(2);	
	
	$gameVariables.setValue(1,0);
	$gameVariables.setValue(2,0);
	
	console.log("Caller Id " + callerId + " | Receiver id " + receiverId);  
	var caller = $dataActors[callerId];
	console.log("Caller " + caller + " | Note " + caller.note);  
	var notedata = caller.note.split(/[\r\n]+/);
	var potaraCandidate = -1;
	var resultActorId = -1;
	
	for (var i = 0; i < notedata.length; i++) 
	{		
	  var line = notedata[i];
	  console.log(line);
	  
	  if (line.match(noteClass))
	  {
		console.log("Line match:");
		potaraCandidate = parseInt(RegExp.$1);
		resultActorId = parseInt(RegExp.$2);
		console.log("ecriture des variables : actor eligible " + potaraCandidate + " fusion " + resultActorId);
		
		if(potaraCandidate != receiverId)
		{
			potaraCandidate = -1;
			resultActorId = -1;
		}
		
	  }else
	  {
		console.log("match failed");
	  }
	}
	
	if(potaraCandidate != receiverId || potaraCandidate <=0 || resultActorId <=0)
	{	
		//Display screen
		return;
	}
	
	var receiver = $dataActors[receiverId];
	$gameParty.addActor(resultActorId);
	
	var callerLevel = Sarreth.Util.getActorTotalLevel(callerId);	
	var receiverLevel = Sarreth.Util.getActorTotalLevel(callerId);
	
	var targetLevel = -1;
	if(callerLevel <= receiverLevel)
	{
		targetLevel = callerLevel;
	}
	else
	{
		targetLevel = receiverLevel;
	}	
	
	Sarreth.Util.addLevelToActorAndCheckForEvol(resultActorId, targetLevel);
	
	console.log("Caller " + caller.name + " | Receiver " + receiver.name + " | Fused " + $gameActors.actor(resultActorId).name);  
	
	$gameParty.removeActor(receiverId);
	$gameParty.removeActor(callerId);
};

Sarreth.Util.getActorTotalLevel = function(actorId)
{
	var callerTotalLevel = 1;	
	var gameCaller = $gameActors.actor(actorId);
	
	for(var level = 1; level < $dataClasses.length; level++)
	{
		if($dataClasses[level])
			callerTotalLevel += gameCaller.classLevel($dataClasses[level].id) - 1;
	}
	
	return callerTotalLevel;
}

Sarreth.Util.addLevelToActorAndCheckForEvol = function(actorId, levelToAdd)
{
	while(levelToAdd > 0)
	{
		$gameActors.actor(actorId).changeLevel($gameActors.actor(actorId).level+1, false);
		Sarreth.Util.checkActorLevel(actorId);
		levelToAdd--;
	}
}

