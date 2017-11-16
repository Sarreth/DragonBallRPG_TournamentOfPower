/*:
*
* @plugindesc Dragon Ball Utils plugin version 4.0
* Assembly with some utilities for the Dragon Ball Tournament Of Power game.
* See help for indications about Plugin Command.
*
* @param ---Transformation---
* @default
*
* @param Transformation Message
* @parent ---Transformation---
* @desc Set the text to display when you transform. Use %1 to display actor name and %2 to display class name.
* @default %1 s'est transformé en %2
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
* @param Auto Calculate Fused Stats
* @parent ---Fusion---
* @type boolean
* @on Calculate with formula
* @off Manually handle with class
* @desc Set the possibility handle fused actor stats with formula
* @default false
*
* @param Fused Stats Formula
* @parent ---Fusion---
* @desc Set the formula used to generate stats for fused actor. Use %1 for first actor and %2 for second actor. Formula will apply on all stats.
* @default (%1 + %2) * 1.1
*
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
Sarreth.Param.AutoCalculateFusedStats = Boolean(Sarreth.Parameters['Auto Calculate Fused Stats']);
Sarreth.Param.FusedStatsFormula = Sarreth.Parameters['Fused Stats Formula'];

Sarreth.Param.MapIdOnGameOver = Number(Sarreth.Parameters['Respawn on mapId']);
Sarreth.Param.RespawnX = Number(Sarreth.Parameters['Respawn X']);
Sarreth.Param.RespawnY = Number(Sarreth.Parameters['Respawn Y']);
Sarreth.Param.RespawnOnGameOver = Boolean(Sarreth.Parameters['Respawn On GameOver']);

Sarreth.Param.TransformationMessage = Sarreth.Parameters['Transformation Message'];

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
		//TODO Display screen : Impossible de fusionner avec lui
		return;
	}
	
	$gameParty.removeActor(receiverId);
	$gameParty.removeActor(callerId);
	
	$gameParty.addActor(resultActorId);
	
	if(Sarreth.Param.AutoCalculateFusedStats)
	{
		Sarreth.Util.calculateFusedStats(callerId, receiverId, resultActorId);
	}
	
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
		//TODO : Display screen
		return;
	}
	
	$gameParty.addActor(resultActorId);
	
	var callerLevel = Sarreth.Util.getActorTotalLevel(callerId);	
	var receiverLevel = Sarreth.Util.getActorTotalLevel(receiverId);
	
	if(Sarreth.Param.AutoCalculateFusedStats)
	{
		Sarreth.Util.calculateFusedStats(callerId, receiverId, resultActorId);
	}
	
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

Sarreth.Util.calculateFusedStats = function(callerId, receiverId, fusedId)
{
	var callerActor = $gameActors.actor(callerId);
	var receiverActor = $gameActors.actor(receiverId);
	var fusedActor = $gameActors.actor(fusedId);
	
	var mhpFormula = Sarreth.Param.FusedStatsFormula.format("callerActor.mhp", "receiverActor.mhp");
	var mmpFormula = Sarreth.Param.FusedStatsFormula.format("callerActor.mmp", "receiverActor.mmp");

	var agiFormula = Sarreth.Param.FusedStatsFormula.format("callerActor.agi", "receiverActor.agi");
	var atkFormula = Sarreth.Param.FusedStatsFormula.format("callerActor.atk", "receiverActor.atk");
	var defFormula = Sarreth.Param.FusedStatsFormula.format("callerActor.def", "receiverActor.def");
	var lukFormula = Sarreth.Param.FusedStatsFormula.format("callerActor.luk", "receiverActor.luk");
	var matFormula = Sarreth.Param.FusedStatsFormula.format("callerActor.mat", "receiverActor.mat");
	var mdfFormula = Sarreth.Param.FusedStatsFormula.format("callerActor.mdf", "receiverActor.mdf");
	
	var resultHp=eval(mhpFormula);
	var resultMp=eval(mmpFormula);
	
	var resultAgi=eval(agiFormula);
	var resultAtk=eval(atkFormula);
	var resultDef=eval(defFormula);
	var resultLuk=eval(lukFormula);
	var resultMat=eval(matFormula);
	var resultMdf=eval(mdfFormula);
	
	fusedActor.addParam(0, Math.round(resultHp - fusedActor.mhp));
	fusedActor.addParam(1, Math.round(resultMp - fusedActor.mmp));
	
	fusedActor.addParam(2, Math.round(resultAtk - fusedActor.atk));
	fusedActor.addParam(3, Math.round(resultDef - fusedActor.def));
	fusedActor.addParam(4, Math.round(resultMat - fusedActor.mat));
	fusedActor.addParam(5, Math.round(resultMdf - fusedActor.mdf));
	fusedActor.addParam(6, Math.round(resultAgi - fusedActor.agi));
	fusedActor.addParam(7, Math.round(resultLuk - fusedActor.luk));
};

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

Sarreth.Util.resetFusionsIfNeeded = function(battleEnded)
{
	var toRemove = [];
	
	for(var fusionIndex = 0; fusionIndex < fusionResultIds.length; fusionIndex++)
	{
		if(battleEnded || fusionCountdown[fusionIndex] == 0)
		{
			Sarreth.Util.setHealthToFusedActor(fusionResultIds[fusionIndex], fusionCallerIds[fusionIndex], fusionReceiverIds[fusionIndex])
			$gameParty.removeActor(fusionResultIds[fusionIndex]);
			$gameParty.addActor(fusionCallerIds[fusionIndex]);
			$gameParty.addActor(fusionReceiverIds[fusionIndex]);
			
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

Sarreth.Util.displayTransform = function(actor, skills) {
    var text = Sarreth.Param.TransformationMessage.format(actor.name(), actor.currentClass().name);
    $gameMessage.newPage();
    $gameMessage.add(text);
	
    skills.forEach(function(skill) {
        $gameMessage.add(TextManager.obtainSkill.format(skill.name));
    });
};

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
	Sarreth.Util.resetFusionsIfNeeded(true);
	Sarreth.Util.BattleManager_processEscape.call(this);
};

Sarreth.Util.BattleManager_processAbort = BattleManager.processAbort;
BattleManager.processAbort = function () 
{
	Sarreth.Util.resetFusionsIfNeeded(true);
	Sarreth.Util.BattleManager_processAbort.call(this);
};

Sarreth.Util.BattleManager_processDefeat = BattleManager.processDefeat;
BattleManager.processDefeat = function () 
{
	Sarreth.Util.resetFusionsIfNeeded(true);
	Sarreth.Util.BattleManager_processDefeat.call(this);
};

Sarreth.Util.BattleManager_processVictory = BattleManager.processVictory;
BattleManager.processVictory = function () 
{	
	Sarreth.Util.resetFusionsIfNeeded(true);
	Sarreth.Util.BattleManager_processVictory.call(this);
};

Sarreth.Util.BattleManager_updateTurnEnd = BattleManager.updateTurnEnd;
    BattleManager.updateTurnEnd = function () 
{
	Sarreth.Util.resetFusionsIfNeeded(false);		
	Sarreth.Util.BattleManager_updateTurnEnd.call(this);
};

//////=========================================================================
////// GameActor
//////=========================================================================

Sarreth.Util.GameActor_changeExp = Game_Actor.prototype.changeExp;

Game_Actor.prototype.changeExp = function(exp, show)
{
	var curClass = this.currentClass();
	var lastSkills = this.skills();
	
	Sarreth.Util.GameActor_changeExp.call(this, exp, show);
	var newCurClass = this.currentClass();
	if(curClass != newCurClass)
	{
		Sarreth.Util.displayTransform(this, this.findNewSkills(lastSkills));
	}
};

Sarreth.Util.GameActor_levelUp = Game_Actor.prototype.levelUp;

Game_Actor.prototype.levelUp = function()
{
	Sarreth.Util.GameActor_levelUp.call(this);
	Sarreth.Util.checkActorLevel(this);	
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
