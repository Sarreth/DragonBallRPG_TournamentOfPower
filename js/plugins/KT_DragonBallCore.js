/*:
*
* @plugindesc Dragon Ball Utils plugin version 3.2
* Assembly with some utilities for the Dragon Ball Tournament Of Power game.
* See help for indications about Plugin Command.
*
* @param ---Fusion---
* @default
*
* @param Fusion Duration
* @parent ---Fusion---
* @type number
* @min 1
* @desc Number of turns before fusion expire
* @default 6
*
* @param ---Gameover---
* @default
*
* @param Respawn On GameOver
* @parent ---Gameover---
* @type boolean
* @on Respawn
* @off GameOver
* @desc Set the possibility of respawning instead of going to GameOver screen when your team is KO
* @default false
*
* @param Respawn on mapId
* @parent ---Gameover---
* @type number
* @min -1
* @desc Set the id of the map where you want to respawn on gameover. -1 if you want to respawn on CurrentMap.
* @default -1
*
* @param Respawn X
* @parent ---Gameover---
* @type number
* @min -1
* @desc Set the x position of the respawn. -1 if you want to respawn on current x.
* @default -1
*
* @param Respawn Y
* @parent ---Gameover---
* @type number
* @min -1
* @desc Set the y position of the respawn. -1 if you want to respawn on current y.
* @default -1
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

Sarreth.Parameters = PluginManager.parameters('KT_DragonBallCore');
Sarreth.Param = Sarreth.Param || {};

Sarreth.Param.FusionDuration = Number(Sarreth.Parameters['Fusion Duration']);
Sarreth.Param.MapIdOnGameOver = Number(Sarreth.Parameters['Respawn on mapId']);
Sarreth.Param.RespawnX = Number(Sarreth.Parameters['Respawn X']);
Sarreth.Param.RespawnY = Number(Sarreth.Parameters['Respawn Y']);
Sarreth.Param.RespawnOnGameOver = Boolean(Sarreth.Parameters['Respawn On GameOver']);

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

Sarreth.Util.onBattleEnd = function()
{
	var toRemove = [];
	
	for(var fusionIndex = 0; fusionIndex < fusionResultIds.length; fusionIndex++)
	{
		Sarreth.Util.setHealthToFusedActor(fusionResultIds[fusionIndex], fusionCallerIds[fusionIndex], fusionReceiverIds[fusionIndex])
		$gameParty.removeActor(fusionResultIds[fusionIndex]);
		$gameParty.addActor(fusionCallerIds[fusionIndex]);
		$gameParty.addActor(fusionReceiverIds[fusionIndex]);
		
		toRemove.push(fusionIndex);
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

Sarreth.Util.checkTempFusion = function() 
{	
	console.log("Méthode checkPotaraFusion avec " + $gameParty.members().length + " actors");  
	var noteClass = /<(?:TEMPFUSION WITH)[ ](\d+):[ ](?:RESULT)[ ](\d+)>/i;
	var callerId = $gameVariables.value(1);
	var receiverId = $gameVariables.value(2);	
	
	var baseCallerId = $gameActors.actor(callerId)._baseActorId;
	var baseReceiverId = $gameActors.actor(receiverId)._baseActorId;
	
	$gameVariables.setValue(1,0);
	$gameVariables.setValue(2,0);
	
	console.log("Caller Id " + callerId + " | Receiver id " + receiverId);  
	var caller = $dataActors[baseCallerId];
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
		
		if(fusionCandidate != baseReceiverId)
		{
			fusionCandidate = -1;
			resultActorId = -1;
		}
		
	  }else
	  {
		console.log("match failed");
	  }
	}
	
	if(fusionCandidate != baseReceiverId || fusionCandidate <=0 || resultActorId <=0)
	{	
		//Display screen
		return;
	}
	
	$gameParty.removeActor(receiverId);
	$gameParty.removeActor(callerId);
	
	$gameParty.addActor(resultActorId);
	
	var callerLevel = Sarreth.Util.getActorTotalLevel(callerId);	
	var receiverLevel = Sarreth.Util.getActorTotalLevel(receiverId);
	
	var targetLevel = callerLevel + receiverLevel;
	
	Sarreth.Util.addLevelToActorAndCheckForEvol(resultActorId, targetLevel);
	Sarreth.Util.setHealthForFusionActor(resultActorId, callerId, receiverId);
	
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
	
	var baseCallerId = $gameActors.actor(callerId)._baseActorId;
	var baseReceiverId = $gameActors.actor(receiverId)._baseActorId;
	
	$gameVariables.setValue(1,0);
	$gameVariables.setValue(2,0);
	
	console.log("Caller Id " + callerId + " | Receiver id " + receiverId);  
	var caller = $dataActors[baseCallerId];
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
		
		if(potaraCandidate != baseReceiverId)
		{
			potaraCandidate = -1;
			resultActorId = -1;
		}
		
	  }else
	  {
		console.log("match failed");
	  }
	}
	
	if(potaraCandidate != baseReceiverId || potaraCandidate <=0 || resultActorId <=0)
	{	
		//Display screen
		return;
	}
	
	$gameParty.addActor(resultActorId);
	
	var callerLevel = Sarreth.Util.getActorTotalLevel(callerId);	
	var receiverLevel = Sarreth.Util.getActorTotalLevel(receiverId);
	
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
	Sarreth.Util.setHealthForFusionActor(resultActorId, callerId, receiverId);
	
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
		Sarreth.Util.checkActorLevel($gameActors.actor(actorId));
		levelToAdd--;
	}
}

Sarreth.Util.setHealthForFusionActor = function(actorId, firstId, secondId)
{
	var firstHealthRatio = $gameActors.actor(firstId).hp / $gameActors.actor(firstId).mhp;
	var secondHealthRatio = $gameActors.actor(secondId).hp / $gameActors.actor(secondId).mhp;
	
	var averageHealthRatio = (firstHealthRatio + secondHealthRatio)/2;
	
	$gameActors.actor(actorId).setHp(Math.round(averageHealthRatio * $gameActors.actor(actorId).mhp));
}

Sarreth.Util.setHealthToFusedActor = function(actorId, firstId, secondId)
{
	var healthRatio = $gameActors.actor(actorId).hp / $gameActors.actor(actorId).mhp;
	
	$gameActors.actor(firstId).setHp(Math.round(healthRatio * $gameActors.actor(firstId).mhp));
	$gameActors.actor(secondId).setHp(Math.round(healthRatio * $gameActors.actor(secondId).mhp));
}

Sarreth.Util.checkGroupActorLevel = function() 
{	
	console.log("Méthode checkActorLevel avec " + $gameParty.members().length + " actors");  
	var noteClass = /<(?:NEXTCLASS):[ ](\d+)[ ](?:LEVEL)[ ](\d+)>/i;

	for (var n = 0; n < $gameParty.members().length; n++) 
	{		
		Sarreth.Util.checkActorLevel($gameParty.members()[n]);
	}
};

Sarreth.Util.checkActorLevel = function(actor) 
{
	var noteClass = /<(?:NEXTCLASS):[ ](\d+)[ ](?:LEVEL)[ ](\d+)>/i;
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

Sarreth.Util.setRespawn = function()
{
	var id = $gameMap.mapId();
	var x = $gamePlayer.x;
	var y = $gamePlayer.y;
	
	if(Sarreth.Param.MapIdOnGameOver >= 0)
	{
		id = Sarreth.Param.MapIdOnGameOver;
	}		
	if(Sarreth.Param.RespawnX >= 0)
	{
		x = Sarreth.Param.RespawnX;
	}		
	if(Sarreth.Param.RespawnY >= 0)
	{
		y = Sarreth.Param.RespawnY;
	}
	
	$gameParty.reviveBattleMembers();
	
	for (var i = 0; i < $gameParty.allMembers().length; i++) {
		var actor = $gameParty.allMembers()[i];
		actor.recoverAll();
	};	
	
	SceneManager.pop();
	$gamePlayer.reserveTransfer(id, x, y);
	$gamePlayer.requestMapReload();
}

//=============================================================================
// Prototype
//=============================================================================

//////=========================================================================
////// BattleManager
//////=========================================================================

Sarreth.Util.BattleManager_updateBattleEnd = BattleManager.updateBattleEnd;
BattleManager.updateBattleEnd = function()
{
	if (Sarreth.Param.RespawnOnGameOver && $gameParty.isAllDead()) 
	{
		Sarreth.Util.setRespawn();
	}
	else
	{
		Sarreth.Util.BattleManager_updateBattleEnd.call(this);
	}
}

Sarreth.Util.BattleManager_processEscape = BattleManager.processEscape;
BattleManager.processEscape = function () 
{
	Sarreth.Util.onBattleEnd();
	Sarreth.Util.BattleManager_processEscape.call(this);
};

Sarreth.Util.BattleManager_processAbort = BattleManager.processAbort;
BattleManager.processAbort = function () 
{
	Sarreth.Util.onBattleEnd();
	Sarreth.Util.BattleManager_processAbort.call(this);
};

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

//////=========================================================================
////// Scene
//////=========================================================================

Sarreth.Util.SceneBase_checkGameover = Scene_Base.prototype.checkGameover;
Scene_Base.prototype.checkGameover = function() 
{
    if ($gameParty.isAllDead() && Sarreth.Param.RespawnOnGameOver) 
	{
        Sarreth.Util.setRespawn();
    }else
	{
		Sarreth.Util.SceneBase_checkGameover.call(this);
	}
};
