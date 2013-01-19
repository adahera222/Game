#pragma strict

/*
This script is applied to prefab clones. At runtime, nothing has this script attached. When
the clone is instantiated, a blank script exists, but the values have to be set.
*/

/*
	Unique DB id
*/
public var questId: int;

/*
	Unique name of item. Mainly so other steps can know if it has been dealt with appropriately
*/
public var itemName: String;

/* Possible actions:
	destroy: destroy the object int the scene, ie: click object and the object is destroyed (goes to inv etc)
	changeMaterial: just change the material on the object, ie: click on a door, and it opens
*/
public var action: String;

/*
	Only needed for action changeMaterial right now
*/
public var newMaterial: String;




// ==================================================================================
// general item properties, not specific to quests - its own thing?
// ==================================================================================

/*
	Helps system to know what to do when the item is clicked on. 
		// existing options
		Item - added to inventory
		Quest - checked for what to do
		Door - check status. open if not locked
		
		// possible future options
		NPC - begin dialog
		MOB - begin combat
*/
public var itemType: String;

/*
	Just used for doors right now. Should be locked or open
*/
public var status: String;

/*
	Again, just for doors right now. Should be the name of the key required to open it
*/

public var requirement: String;

function Start () {

}

function Update () {

}