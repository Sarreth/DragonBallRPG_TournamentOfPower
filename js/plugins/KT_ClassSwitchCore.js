/*:
*
* @plugindesc First Plugin version 1.5
* @author Sarreth
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
		var evalMode = 'none';
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

