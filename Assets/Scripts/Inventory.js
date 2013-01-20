#pragma strict

/* 
Simple array for now. Before we are done, I'm sure this will be a lengthy class for managing the real inventory.
*/

var aryInventory = new ExtendedArray();



class clsInventory {
	var item = new List.<clsItem>();
	var count: int; // quantity of this item in inventory
	
	function AddToInventory(itemId: int) {
	
	} // end function AddToInventory(itemId: int)
	
	function RemoveFromInventory(itemId: int) {
	
	} // end function RemoveFromInventory(itemId: int)
	
	function DropItem(itemId: int) {
	
	} // end function DropItem(itemId: int)
	
	function  SwapItems(itemId1: int, itemId2: int) {
	
	} // end function  SwapItems(itemId1: int, itemId2: int)
	
	function Contains(itemId: int) {
	
	} // end function Contains(itemId: int)
	
}; // end class clsInventory

function Start () {

}

function Update () {

}