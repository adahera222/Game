#pragma strict

/* GUI vars
*/
//NOTE: UnityGUI skin images can be downloaded from unity3d.com/support/resources/assets/built-in-gui-skin
var mainSkin: GUISkin; // new GUISkin set from editor
var refNecromancerGUIScript: NecromancerGUIScript; // ref to the necro skin script

var windowInventory: Rect = Rect (0, 40, 350, 500); // predefined rect for the inventory
var windowInventoryContextMenu: Rect = Rect (200, 200, 200, 200); // rect for the context menu

var contextInventoryIndex : int; // inventory slot the context menu is open for
var empty : Texture2D; // empty inventory slot texture

var inventoryContextMenuWindowID : int = 4; // window ID of the inventory context menu window

// texture for the TEMP instructions
var bgInstructions: Texture2D;

var Inventory: clsInventory;

static var showInventory: boolean = false;
static var showInventoryItemContextMenu: boolean = false;


/* Initialize stuff at startup 
*/
function Start () {
	refNecromancerGUIScript = GetComponent(NecromancerGUIScript);
	
	// instructions window init	
	bgInstructions = Resources.Load("window") as Texture2D;

	// prep the inventory	
	empty = Resources.Load("EmptyInventorySlot") as Texture2D;
	Inventory = new clsInventory(empty);
} // end function Start ()

function OnGUI() {
	GUI.skin = mainSkin;
	
//	ShowInstructions();
	
    if (showInventory)
    {
		// to be draggable, it MUST set the rect = GUI.Window(x, rect
		// that doesn't make sense to me, but that's the only way I 
		// could make it be draggable when I was done????????????????
		windowInventory = GUILayout.Window (3, windowInventory, DoInventoryWindow, "");
		GUI.BeginGroup (Rect (0,0,100,100));
		// End the group we started above. This is very important to remember!
		GUI.EndGroup ();
    } // end if (showInventory)
    
    if (showInventoryItemContextMenu)
    {
    
		windowInventoryContextMenu = GUILayout.Window (inventoryContextMenuWindowID, windowInventoryContextMenu, DoInventoryContextWindow, "");
		GUI.BeginGroup (Rect (0,0,100,100));
		// End the group we started above. This is very important to remember!
		GUI.EndGroup ();
	} // end if (showInventoryItemContextMenu)
	
} // end function OnGUI()



/* Build the the inventory window using the GUILayout
*/
function DoInventoryWindow(windowID : int) {
	// use the spike function to add the spikes
	refNecromancerGUIScript.AddSpikes(windowInventory.width);
	//add a fancy top using the fancy top function
	refNecromancerGUIScript.FancyTop(refNecromancerGUIScript.windowRect0.width);

	GUILayout.Space(8);
	GUILayout.BeginVertical();
	GUILayout.Label("Inventory: " + Inventory.inventoryItemCount + " / " + Inventory.maxInventorySize);
	GUILayout.Label ("", "Divider");
	GUILayout.Space(8);
	LoadInventory();
    GUILayout.EndVertical();
	
	// add a wax seal at the bottom of the window
	refNecromancerGUIScript.WaxSeal(windowInventory.width , windowInventory.height);
	
	GUI.DragWindow (Rect (0,0,10000,100));
} // end function DoInventoryWindow(windowID : int)

/* Build the contents of the inventory. This is just the rows of inventory cells.
*/
function LoadInventory () {
	var invHorizontalMax: int = 5;
	var inventoryTexture : Texture;
	
	var inventorySlotStyle: GUIStyle; // defines width/height for inv slot
	inventorySlotStyle = new GUIStyle();
	inventorySlotStyle.fixedWidth = 32;
	inventorySlotStyle.fixedHeight = 32;
	
	GUILayout.BeginHorizontal();
	for (var ind: int = 0;ind<Inventory.maxInventorySize;ind++)
	{
		if (Inventory.aryInventoryImages[ind] == "")
		{
			inventoryTexture = Resources.Load("EmptyInventorySlot") as Texture;
			GUILayout.Box(inventoryTexture, inventorySlotStyle);
			Inventory.inventoryItemCount = 0;
		}
		else
		{
			inventoryTexture = Inventory.aryInventoryImages[ind];
			// need some way to add mouseclick event to this
			GUILayout.Box(inventoryTexture, inventorySlotStyle);
			// 1 = mouse right button
			if (Input.GetMouseButton(1) && GUILayoutUtility.GetLastRect().Contains(Event.current.mousePosition))
			{
				showInventoryItemContextMenu = true;
				contextInventoryIndex = ind;
				windowInventoryContextMenu.x = Event.current.mousePosition.x;
				windowInventoryContextMenu.y = Event.current.mousePosition.y;
			}
		}
			
		if ( ((ind+1) % invHorizontalMax) == 0)
		{
			GUILayout.EndHorizontal();
			GUILayout.BeginHorizontal();
		}
	}
	
	GUILayout.EndHorizontal();
} // end function LoadInventory ()

/* Build the context menu window
*/
function DoInventoryContextWindow(windowID: int) {
	// if the index is invalid, just stop
	if  (contextInventoryIndex == -1 || contextInventoryIndex >= Inventory.maxInventorySize)
	{
		contextInventoryIndex = -1;
		showInventoryItemContextMenu = false;
		return;
	}
	
	GUILayout.Space(40);
	GUILayout.BeginVertical();
	GUILayout.Button("Equip");
	GUILayout.Button("Drop");
	if (GUILayout.Button("Delete"))
	{
		Inventory.aryInventoryImages[contextInventoryIndex] = empty;
		Inventory.inventoryItemCount--;
		contextInventoryIndex = -1;
		showInventoryItemContextMenu = false;
	}
    GUILayout.EndVertical();
} // end function DoInventoryContextWindow(windowID: int)

/* Place a feaux window at the top/right with directions on what to actually do with this app.
 * This was just an example and a temp window so the controls were obvious. It can be deleted
 * or replaced by some kind of permanent help?
*/
function ShowInstructions() {
	var ScreenX: int;
	var ScreenY: int = 0;
	var areaWidth: int = 250;
	var areaHeight: int = 500;
	ScreenX = Screen.width - 250;

	// since we are not in a window, we have to change the left/right margins
	var tmpDivider: GUIStyle = GUIStyle("Divider");
	tmpDivider.margin.left = 25;
	tmpDivider.margin.right = 25;
	var tmpTextAreaStyle: GUIStyle = GUIStyle("TextArea");
	tmpTextAreaStyle.margin.left = 25;
	tmpTextAreaStyle.margin.right = 25;

	GUILayout.BeginArea(Rect (ScreenX, ScreenY, areaWidth, areaHeight), bgInstructions);
	GUILayout.BeginVertical();
	GUILayout.Space(35);
	GUILayout.Label("Instructions");	
	GUILayout.Label("", tmpDivider);
	GUILayout.TextArea("Click 'I' to open the inventory", tmpTextAreaStyle);
	GUILayout.TextArea("Click an object to add it to the inventory", tmpTextAreaStyle);
	GUILayout.TextArea("Right-click an object in the inventory and choose Delete to remove it", tmpTextAreaStyle);
	GUILayout.EndVertical();
	GUILayout.EndArea();
} // end function ShowInstructions()

