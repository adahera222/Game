#pragma strict

import System; // need system and system IO to read files.
import System.IO;
import System.Collections.Generic;

var aryItems = new List.<clsItem>(); // create the master array of items
var maxItemLines : int = 500; // max lines that can be read from Items.txt. Safeguard against infinite loop.

var key: Transform; // holds key prefab (assigned from editor)
var portal: Transform; // holds portal prefab (assigned from editor)
var relic: Transform; // holds portal relic (assigned from editor)

var questMaterial : Material; // new quest item texture
var newQuestItem : Transform;

var scrQuest: QuestItem; // script reference

var characterPrefab: GameObject;
private var GameLevel: ILevel;
var missingInventoryTexture: Texture2D;	

/* This class defines everything there is to know about an item in the world.
	There is a master List of items = new List<clsItem>(). 
*/
class clsItem {
	var itemId: int; // unique item id. World objects will just have this attached to them
	var name: String; // name that shows up in the inventory
	var description: String; // flavor text for the most part for the inventory
	var equipment: boolean = false; // flag to indicate it can be equipped
	var consumable: boolean = false; // flag to indicate it is a useable item that consumes charges. Once charges reach 0, item is destroyed
	var charges: int = 0; // how many times the item can be used
	var chargeTime: int = 0; // amount of time the charge lasts. seconds?
	var stats = new List.<clsStats>(); // basically an array of stats the item modifies
	var requirements = new List.<clsRequirements>(); // an array of requirements that must be met before item can be used (eqipped/consumed)
	var textureInventory: Texture2D; // texture to show in the inventory
	var textureEquipped: Texture2D; // texture to show on the paperdoll when the item is equipped
	var worldObject: Transform; // prefab name to instantiate when item is put out in the world
	var material: Material; // material to put on the worldObject
	var x: float; // x location for instantiation
	var y: float; // y location for instantiation
	var z: float; // z location for instantiation
	
	// should the quest info be in a separate file and class?
	var questId: int; // quest items are flagged so they trigger clsQuestLog.EvaluateQuest
	var action: String; // quest action to take on clicked
	var itemType: String; // quest item type
	var status: String; // quest status
	var newMaterial: String;
	var requirement: String;
}; // end class clsItem

/* The class only holds a single stat to be modified. Each stat modified will be in the 
	containing List. The modifier can be positive or negative.
*/
class clsStats {
	var stat: String; // stat to modify. should this be enum?
	var modifier: int; // +/- amount to modify the value by
}; // end class clsStats

/* This class contains some specific requirements, such as itemId for ease of use.
	Other requirements will be dumped in "other" and coded appropriately. These may be detailed
	out at some point if they are used frequently enough. The check will just go down 
	the list looking for a single requirement. If there are multiple requirements, they
	will be in a list. Each class will only contain 1 requirement.
*/
class clsRequirements {
	var item: int; // itemId if that is what is required
	var stat: String; // stat, like agility, that is required
	var statValue: int; // min required value of stat
	var other: String; // catchall for any other type of requirement
	var otherValue: String; // value to go with other
}; // end class clsRequirements




function LoadItems () {
	var aryQuestItems = new List.<clsItem>();
	var scrLevel = Level;

//	scrLevel = GameObject.Find("GameManager").GetComponent(Level);
	
	aryQuestItems = GetQuestItems(1);
	for (var item: clsItem in aryQuestItems) {
		newQuestItem = Instantiate(item.worldObject, Vector3(item.x, item.y, item.z), Quaternion.identity);
		
		GameLevel.PlaceQuestItem(newQuestItem.gameObject);
		// set the material appropriately
		if (item.worldObject.renderer && item.material != null)
			newQuestItem.renderer.material = item.material;
		// set the script QuestItem.questId and QuestItem.itemName
		scrQuest = newQuestItem.GetComponent(QuestItem);
		scrQuest.questId = item.questId;
		scrQuest.itemId = item.itemId;
		scrQuest.itemName = item.name;
		scrQuest.action = item.action;
		scrQuest.itemType = item.itemType;
		scrQuest.status = item.status;
		scrQuest.newMaterial = item.newMaterial;
		scrQuest.requirement = item.requirement;
	}
}

/* Right now, this function just finds any quest items in existence and Destroy's em. This should be much
	more intelligent at some point. Maybe we put all items in a container object and then this function 
	could just remove anything in it?
*/
function CleanUpLevel() {
	for (var destroyItem: GameObject in GameObject.FindGameObjectsWithTag("quest")) {
		GameObject.Destroy(destroyItem);
	}
} // end function CleanUpLevel()

function OnGUI () {
   	if (GUI.Button (new Rect (10,10,75,25), "Generate")) {
   		CleanUpLevel(); // remove all existing items
		GameLevel.GenerateNewLevel(); // create a new level
		LoadItems (); // load new items
	}		
}	



function Start () {
	var tmpValue : String; // holds the line value so we can break it into its parts:key, value, comment
	var arySplit = new Array(); // holds the resulting array from the Split function
	var key : String; // holds the key value from the line
	var itemValue: String; // holds the actual item value from the line
	var comment: String; // holds the comment value from the line. We don't do anything with it though
//	var aryItemValues = new Array(); // holds the key/value pairs from the file until we can add them to Items.aryItems
//	var aryItemValues = new Dictionary.<String, String>();
	var aryItemValues = new Hashtable();
	
	// create a single item
	var item = new clsItem();
	
	missingInventoryTexture = UnityEngine.Resources.Load("MissingInventoryTexture") as Texture2D;
	GameLevel = new Level(new SnakeMap(), new StoneHallRenderer(), characterPrefab);

	// now load all the items from a file
	if(File.Exists(Application.dataPath + "/DataFiles/Items.txt")) {
		var itemFile = File.OpenText(Application.dataPath + "/DataFiles/Items.txt");
		var line = itemFile.ReadLine();
		var linesRead: int = 0;
		while(line != null) {
			// just to safeguard against infinite loop
			if (linesRead > maxItemLines) {
				Debug.Log("Hit the max item file line size of " + maxItemLines + ". Increase the variable in Items script to accomodate.");
				break;
			}
				
			// skip blank lines
			if (line == "") {
				line = itemFile.ReadLine();
				linesRead++;
				continue;
			}
				
			// a "[end item]" line indicates the end of the item, so add it
			if (line == "[end item]") {
				// 1. make sure the min set of key/values are there
				if (!aryItemValues.ContainsKey("itemId") || !aryItemValues.ContainsKey("name")) {
					Debug.Log(aryItemValues["itemId"] + ") incomplete item.");
				}
				else {
					// 2. transfer aryItemValues into item
					if (aryItemValues["itemId"] != null)
						item.itemId = parseInt(aryItemValues["itemId"] as String);
					if (aryItemValues["name"] != null)
						item.name = aryItemValues["name"] as String;
					if (aryItemValues["description"] != null)
						item.description = aryItemValues["description"] as String;
					if (aryItemValues["equipment"] != null) {
						if (aryItemValues["equipment"] == "false")
							item.equipment = false;
						else
							item.equipment = true;
					}
					if (aryItemValues["consumable"] != null) {
						if (aryItemValues["consumable"] == "false") 
							item.consumable = false;
						else
							item.consumable = true;
					}
					if (aryItemValues["charges"] != null)
						item.charges = parseInt(aryItemValues["charges"] as String);
					if (aryItemValues["chargeTime"] != null)
						item.chargeTime = parseInt(aryItemValues["chargeTime"] as String);
						
					// these are all complex item types
					if (aryItemValues["stats"] != null) {
						// have to parse the string into a clsStats
//						item.stats = aryItemValues["stats"];
					}
					if (aryItemValues["requirements"] != null) {
						// have to parse the string into a clsRequirements
//						item.requirements = aryItemValues["requirements"];
					}				
					// just textures, so we can load those from strings ok
					if (aryItemValues["textureInventory"] != null)
						item.textureInventory = UnityEngine.Resources.Load(aryItemValues["textureInventory"]) as Texture2D;
					if (aryItemValues["textureEquipped"] != null)
						item.textureEquipped = UnityEngine.Resources.Load(aryItemValues["textureEquipped"]) as Texture2D;
						
					// this  is just a string name of the prefab to instantiate
					if (aryItemValues["worldObject"] != null) {
						item.worldObject = UnityEngine.Resources.Load("Prefabs/" + aryItemValues["worldObject"], Transform);
					}
					if (aryItemValues["material"] != null) {
						item.material = UnityEngine.Resources.Load(aryItemValues["material"]) as Material;
					}
					if (aryItemValues["x"] != null) {
						item.x = parseFloat(aryItemValues["x"] as String);
					}
					if (aryItemValues["y"] != null) {
						item.y = parseFloat(aryItemValues["y"] as String);
					}
					if (aryItemValues["z"] != null) {
						item.z = parseFloat(aryItemValues["z"] as String);
					}
					
					// handle all quest values here, just in case they get separated out
					if (aryItemValues["questId"] != null)
						item.questId = parseInt(aryItemValues["questId"] as String);
					if (aryItemValues["action"] != null)
						item.action = aryItemValues["action"] as String;
					if (aryItemValues["itemType"] != null)
						item.itemType = aryItemValues["itemType"] as String;
					if (aryItemValues["status"] != null)
						item.status = aryItemValues["status"] as String;
					if (aryItemValues["newMaterial"] != null)
						item.newMaterial = aryItemValues["newMaterial"] as String;
					if (aryItemValues["requirement"] != null)
						item.requirement = aryItemValues["requirement"] as String;
					
					aryItems.Add(item);
				}
						
				// clear the item object for the next item
				item = new clsItem();
				aryItemValues = new Hashtable();
			} // end if (line == "[end item]")
			else {
				// parse the line into field:value; //comment
				tmpValue = line;
				arySplit = tmpValue.Split(":"[0]);
				key = arySplit[0] as String;
				key = key.Trim();
				
				tmpValue = arySplit[1] as String;
				arySplit = tmpValue.Split(";"[0]);
				itemValue = arySplit[0] as String;
				itemValue = itemValue.Trim();
				
				// IF there is a comment, grab it
				if (arySplit.Count > 1)
				{
					tmpValue = arySplit[1] as String;
					arySplit = tmpValue.Split("//"[0]);
					comment = arySplit[1] as String;
					comment = comment.Trim();
				}
				aryItemValues[key] = itemValue;
			} // end else.  if (line == "[end item]")
				
			line = itemFile.ReadLine();
			linesRead++;
			key = null;
			itemValue = null;
			comment = null;
		} // end while(line != null) 
	} // end if(File.Exists(Application.dataPath + "/DataFiles/Items.txt"))
	else
		Debug.Log("Error opening the items file.");
	
	// now run SetupScene.LoadItems to load the items into the scene
//	var scrSetupScene: SetupScene;
//	scrSetupScene = GameObject.Find("GameManager").GetComponent("SetupScene");
//	scrSetupScene.LoadItems();
	
	// TODO: load quest items into the world
//	LoadItems ();
} // end function Start ()

function Contains(itemId: int) {
	var arrayIndex: int = 0;
	for(var item: clsItem in aryItems) {
		if (item.itemId == itemId)
			return arrayIndex;
			
		arrayIndex++;
	} // end for(var item: clsItem in aryItems)
	
	// if it was not found, return -1 to indicate failure
	return -1;
} // end function Contains(itemId: int)

function GetQuestItems(questId: int) {
	var aryReturnItems = new List.<clsItem>();
	
	for (var item: clsItem in aryItems) {
		if (item.questId == questId) {
			aryReturnItems.Add(item);
		}
	}
	return aryReturnItems;
} // end function GetQuestItems(questId: int)

function GetItemById(itemId: int) {
	for (var item: clsItem in aryItems) {
		if (item.itemId == itemId) {
			return item;
		}
	}
	return null;
} // end function GetQuestItems(questId: int)