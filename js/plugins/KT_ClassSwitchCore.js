/*:
*
* @plugindesc Dragon Ball Utils plugin version 2.0
* Assembly with some utilities for the Dragon Ball Tournament Of Power game.
* See help for indications about Plugin Command.
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
*
*/

var Sarreth = Sarreth || {};

var _Game_Interpreter_pluginCommand = Game_Interpreter.prototype.pluginCommand;
  Game_Interpreter.prototype.pluginCommand = function(command, args) {
    _Game_Interpreter_pluginCommand.call(this, command, args);
	
	console.log("Commande appelée " + command );
     if(command === 'EvalActorLevel'){
      Sarreth.Util.checkActorLevel();
    }
	
     if(command === 'PotaraFusion'){
      Sarreth.Util.checkPotaraFusion();
    }
  };
  
  
//=============================================================================
// Utils
//=============================================================================

Sarreth.Util = Sarreth.Util || {};

Sarreth.Util.checkActorLevel = function() 
{	
	console.log("Méthode checkActorLevel avec " + $gameParty.members().length + " actors");  
	var noteClass = /<(?:NEXTCLASS):[ ](\d+)[ ](?:LEVEL)[ ](\d+)>/i;

	for (var n = 0; n < $gameParty.members().length; n++) 
	{		
		var actor = $gameParty.members()[n];
		var obj = actor.currentClass();
		console.log("Actor " + $gameParty.members()[n] + " | Class : " + obj);
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
	}
};

// Sarreth.Util.Game_Action_applyItemUserEffect = Game_Action.prototype.applyItemUserEffect;
// Game_Action.prototype.applyItemUserEffect = function (target) 
// {
	// Sarreth.Util.Game_Action_applyItemUserEffect.call(this, target);
	// this.makeSuccess(target);

	// // if target is not enemy
	// if (!target.isEnemy())
		// return;

	// var item = this.item();
	// var dataEnemyMeta = $dataEnemies[target.enemyId()].meta;

	// // if no notetag for corresponding actor
	// if (!$dataActors[dataEnemyMeta.capture_actor_id]) {
		// return;
	// }

	// // if the item or target isn't configured correctly, return
	// if (DreamX.CaptureEnemy.ItemTargetConfiguredProperly(item, dataEnemyMeta) === false) {
		// return;
	// }

	// this.handleCaptureAttempt(target, dataEnemyMeta);
// };

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
	
	var callerLevel = caller.level;
	var receiverLevel = receiver.level;
	
	var targetLevel = -1;
	if(callerLevel <= receiverLevel)
	{
		targetLevel = callerLevel;
	}
	else
	{
		targetLevel = receiverLevel;
	}
	
	while($gameActors.actor(resultActorId).level < targetLevel)
	{
		$gameActors.actor(resultActorId).changeLevel($gameActors.actor(resultActorId).level+1, false);
		Sarreth.Util.checkActorLevel();
	}	
	
	console.log("Caller " + caller.name + " | Receiver " + receiver.name + " | Fused " + $gameActors.actor(resultActorId).name);  
	
	$gameParty.removeActor(receiverId);
	$gameParty.removeActor(callerId);
};

