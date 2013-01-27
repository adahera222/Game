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

function OnGUI () {
   	if (GUI.Button (new Rect (10,10,75,25), "Generate")) {
   		CleanUpLevel(); // remove all existing items
		GameLevel.GenerateNewLevel(); // create a new level
		LoadItems (); // load new items
	}		
}	

function Start () {
	var XMLNodes = new List.<XMLNode>();
	var fileStream: String;
	
	missingInventoryTexture = UnityEngine.Resources.Load("MissingInventoryTexture") as Texture2D;
	GameLevel = new Level(new SnakeMap(), new StoneHallRenderer(), characterPrefab);

	// now load all the items from a file
	if(File.Exists(Application.dataPath + "/DataFiles/Items.xml")) {
		var itemFile = File.OpenText(Application.dataPath + "/DataFiles/Items.xml");
		var line = itemFile.ReadLine();
		var linesRead: int = 0;
		while(line != null) {
			linesRead++;
			// just to safeguard against infinite loop
			if (linesRead > maxItemLines) {
				Debug.Log("Hit the max item file line size of " + maxItemLines + ". Increase the variable in Items script to accomodate.");
				break;
			}
				
			// skip blank lines
			if (line == "") {
				line = itemFile.ReadLine();
				continue;
			}
				
			fileStream += line;
			// a "[end item]" line indicates the end of the item, so add it
			if (line == "</item>") {
				XMLNodes.Add(ParseItem(fileStream));
				fileStream = "";
			}
			
			line = itemFile.ReadLine();
		} // end while(line != null) 
		for(var tmpItem: XMLNode in XMLNodes) {
			// create a single item
			var item = new clsItem();
			item = FillItem(tmpItem);
			aryItems.Add(item);
		}
		
	} // end if(File.Exists(Application.dataPath + "/DataFiles/Items.txt"))
	else
		Debug.Log("Error opening the items file.");
} // end function Start ()

function FillItem(xmlItem: XMLNode) {
	var item = new clsItem();
	// loop thru each attribute in the item
	for (var attr: XMLNode in xmlItem.GetNodeList("item>0>value")) {
		if (attr.GetValue("@fieldName") == "itemId") {
			item.itemId = parseInt(attr.GetValue("_text"));
		}
		if (attr.GetValue("@fieldName") == "name") {
			item.name = attr.GetValue("_text");
		}
		if (attr.GetValue("@fieldName") == "description") {
			item.description = attr.GetValue("_text");
		}
		if (attr.GetValue("@fieldName") == "equipment") {
			if (attr.GetValue("_text") == "true")
				item.equipment = true;
			else
				item.equipment = false;
		}
		if (attr.GetValue("@fieldName") == "consumable") {
			if (attr.GetValue("_text") == "true")
				item.consumable = true;
			else
				item.consumable = false;
		}
		if (attr.GetValue("@fieldName") == "charges") {
			item.charges = parseInt(attr.GetValue("_text"));
		}
		if (attr.GetValue("@fieldName") == "chargeTime") {
			item.chargeTime = parseInt(attr.GetValue("_text"));
		}
		
/*	TODO: not used yet, but have to be filled in eventually	
		if (attr.GetValue("@fieldName") == "stats") {
			item.stats = parseInt(attr.GetValue("_text"));
		}
		if (attr.GetValue("@fieldName") == "requirementsToUse") {
			item.requirements = parseInt(attr.GetValue("_text"));
		}
*/		
		
		
		if (attr.GetValue("@fieldName") == "textureInventory") {
			item.textureInventory = UnityEngine.Resources.Load(attr.GetValue("_text").ToString()) as Texture2D;
		}
		if (attr.GetValue("@fieldName") == "textureEquipped") {
			item.textureEquipped = UnityEngine.Resources.Load(attr.GetValue("_text").ToString()) as Texture2D;
		}
		if (attr.GetValue("@fieldName") == "worldObject") {
			item.worldObject = UnityEngine.Resources.Load("Prefabs/" + attr.GetValue("_text").ToString(), Transform);
		}
		if (attr.GetValue("@fieldName") == "material") {
			item.material = UnityEngine.Resources.Load(attr.GetValue("_text").ToString()) as Material;
		}
		
		if (attr.GetValue("@fieldName") == "x") {
			item.x = parseFloat(attr.GetValue("_text"));
		}
		if (attr.GetValue("@fieldName") == "y") {
			item.y = parseFloat(attr.GetValue("_text"));
		}
		if (attr.GetValue("@fieldName") == "z") {
			item.z = parseFloat(attr.GetValue("_text"));
		}
		if (attr.GetValue("@fieldName") == "questId") {
			item.questId = parseInt(attr.GetValue("_text"));
		}
		if (attr.GetValue("@fieldName") == "action") {
			item.action = attr.GetValue("_text");
		}
		if (attr.GetValue("@fieldName") == "itemType") {
			item.itemType = attr.GetValue("_text");
		}
		if (attr.GetValue("@fieldName") == "status") {
			item.status = attr.GetValue("_text");
		}
		if (attr.GetValue("@fieldName") == "newMaterial") {
			item.newMaterial = attr.GetValue("_text");
		}
		if (attr.GetValue("@fieldName") == "requirement") {
			item.requirement = attr.GetValue("_text");
		}
	}
	
	return item;
}

function ParseItem(itemString: String) {
	var parser = new XMLParser();
	var completeItemNode: XMLNode = parser.Parse(itemString);
	return completeItemNode;
}

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

/* This function finds all the specified quest items and has GameLevel add them to the scene
*/
function LoadItems () {
	var aryQuestItems = new List.<clsItem>();

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

/* Right now, this function just finds any quest items in existence and Destroy's em. This should be much
	more intelligent at some point. Maybe we put all items in a container object and then this function 
	could just remove anything in it?
*/
function CleanUpLevel() {
	for (var destroyItem: GameObject in GameObject.FindGameObjectsWithTag("quest")) {
		GameObject.Destroy(destroyItem);
	}
} // end function CleanUpLevel()

