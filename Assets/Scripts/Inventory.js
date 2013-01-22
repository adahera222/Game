#pragma strict
#pragma downcast

class ExtendedArray extends Array{
	// move to a helper function file or extend Array ================================================================
	function Contains(needle: String) {
		for (var arrayValue: String in this) {
			if (arrayValue == needle)
				return true;
		}
		
		return false;
	} // end function InInventory(needle: string, haystack: Array)
}


class clsInventory {
	var item = new List.<clsItem>();
	var count: int; // quantity of this item in inventory
	
	// TODO: are both needed or did aryInventoryImages replace aryInventory?
	var aryInventory = new ExtendedArray();
	var aryInventoryImages = new List.<Texture2D>();
	var missingInventoryTexture: Texture2D; // placeholder texture for missing images
	var maxInventorySize : int = 10; // max inventory slots available
	var inventoryItemCount : int = 0; // keeps track of how many items are in the inventory
	
	// constructor
	function clsInventory() {
		
	}
	
	/*
		If the object clicked is of type QuestItem.type == "inventory", this function is run.
		Primary: It adds the QuestItem.itemName to the Inventory.aryInventory array.
			Secondary: If it is flagged as QuestItem.action == "destroy", the world object is destroyed.
			Secondary: Else if the QuestItem.action == "changeMaterial", it is modified, but left on screen.
	*/
	function AddToInventory(hit: RaycastHit) {
		var tmpObject = hit.collider.gameObject;

		// this section needs to be someplace else
		var scrQuestItem: QuestItem;
		var scrQuestLog: QuestLog; // script reference
		var scrItems: Items;
		scrQuestLog = GameObject.Find("GameManager").GetComponent(QuestLog);
		scrItems = GameObject.Find("GameManager").GetComponent(Items);
		
		if (tmpObject.tag == "quest") {
			// get its QuestItem script
			scrQuestItem = tmpObject.GetComponent(QuestItem);
	
			aryInventory.Add(scrQuestItem.itemName);
			var EmptyIndex = FindEmptyIndex();
			// ONLY do this stuff if we can pick it up!
			if (EmptyIndex > -1) {
				var item: clsItem = scrItems.GetItemById(scrQuestItem.itemId);
				if (item.textureInventory) {
					aryInventoryImages[EmptyIndex] = item.textureInventory;
				}
				else {
					aryInventoryImages[EmptyIndex] = scrItems.missingInventoryTexture;
				}
				
				scrQuestLog.EvaluateStatus(scrQuestItem.questId);
				inventoryItemCount++;
			}
		}
	
		// take appropriate action
		if (scrQuestItem.action == "destroy")
			GameObject.Destroy(tmpObject);
		else if (scrQuestItem.action == "changeMaterial")
		{
			tmpObject.renderer.material = Resources.Load(scrQuestItem.newMaterial) as Material;
		}
	} // end function AddToInventory(hit: RaycastHit)

	function FindEmptyIndex() {
		var inventorySlotIndex = 0;
		// if the inv is full, report so and stop
		if (maxInventorySize == inventoryItemCount) {
			Debug.Log("Inventory already full");
			return -1;
		}
		// else find an empty slot
		for(var inventorySlot: Texture in aryInventoryImages) {
			if (inventorySlot.name == "EmptyInventorySlot")
				return inventorySlotIndex;
			inventorySlotIndex++;
		}
		Debug.Log("Inventory already full");
		return -1;
	}
	
	function RemoveFromInventory(itemId: int) {
		inventoryItemCount--;
	} // end function RemoveFromInventory(itemId: int)
	
	function DropItem(itemId: int) {
		inventoryItemCount--;
	
	} // end function DropItem(itemId: int)
	
	function  SwapItems(itemId1: int, itemId2: int) {
	
	} // end function  SwapItems(itemId1: int, itemId2: int)
	
	function Contains(itemId: int) {
	
	} // end function Contains(itemId: int)
	
	function InitializeInventory() {
		// manually set the entire array to empty slots
		aryInventoryImages.Add(Resources.Load("EmptyInventorySlot") as Texture);
		aryInventoryImages.Add(Resources.Load("EmptyInventorySlot") as Texture);
		aryInventoryImages.Add(Resources.Load("EmptyInventorySlot") as Texture);
		aryInventoryImages.Add(Resources.Load("EmptyInventorySlot") as Texture);
		aryInventoryImages.Add(Resources.Load("EmptyInventorySlot") as Texture);
		aryInventoryImages.Add(Resources.Load("EmptyInventorySlot") as Texture);
		aryInventoryImages.Add(Resources.Load("EmptyInventorySlot") as Texture);
		aryInventoryImages.Add(Resources.Load("EmptyInventorySlot") as Texture);
		aryInventoryImages.Add(Resources.Load("EmptyInventorySlot") as Texture);
		aryInventoryImages.Add(Resources.Load("EmptyInventorySlot") as Texture);
	} // end function InitializeInventory()
	
}; // end class clsInventory


