#pragma strict

public enum CameraStates {Locked, Returning, MouseLook};

public class CharacterHandler extends MonoBehaviour {
	
	//the map that this character is currently in
	private var _map: IMap;
	private var _navigator: INavigator;
	
	private var targetPosition: Vector3;
	private var targetRotation: Quaternion;
	private var moving: boolean = false;
	private var turning: boolean = false;
	
	private var rotationHorizontal: float;
	private var rotationVertical: float;
	private var cameraState: CameraStates = CameraStates.Locked;
	private var characterCamera: Transform;
	
	//modifiable properties
	public var minSnapDistance: float = 0.05f; 
	public var minSnapAngle: float = 0.5f;
	public var moveSpeed: float = 0.125f;
	public var turnRate: float = 12f;
	public var sensitivityX: int = 5;
	public var sensitivityY: int = 5;
	public var maxLookLeft: int = 75; // degrees camera can "look" left (360 - maxLookLeft)
	public var maxLookRight: int = 75; // degrees camera can "look" right (0 + maxLookRight)
	public var maxLookUp: int = 45; // degrees camera can "look" up (0 + maxLookUp)
	public var maxLookDown: int = 45; // degrees camera can "look" right (360 - maxLookDown)
	
	public var hit : RaycastHit; // returns the object clicked on
	private var scrQuestLog: QuestLog; // script reference
	private var scrQuestItem: QuestItem;
	private var scrInventoryManager: InventoryManager;

	public function PlaceInMap(newMap: IMap) {
		//store a reference to the map
		_map = newMap;
		//grab the navigator off the map
		_navigator = _map.Navigator();
		//position this gameobject using the map's navigator
		transform.position = _navigator.CurrentPosition();
		transform.rotation = Quaternion.LookRotation(_navigator.CurrentFacing(), _navigator.CurrentUpVector());
	}
	
	public function Start () {
		characterCamera = transform.Find("Camera");
		scrInventoryManager = GameObject.Find("GameManager").GetComponent(InventoryManager);
		scrQuestLog = GameObject.Find("GameManager").GetComponent(QuestLog);
	}
	
	// Update is called once per frame
	public function Update () {
		//don't do anything until a valid map is hooked to this handler
		if ( _map == null ) { return; }
		
		//check to see if the user is "Mouse" looking
		CheckMouseLook();
		
		// see if the user clicked on the screen, and if so, if they clicked on an item
		CheckMouseClick();
		
		//If the player is moving, handle the movement and don't accept keyboard input
		if (moving) {
			transform.position = Vector3.MoveTowards(transform.position, targetPosition, moveSpeed);
			//see if the movement is finished. If we are close enough to the target position, end the movement
			var distanceLeftSqr: float = (targetPosition - transform.position).sqrMagnitude;
			if (distanceLeftSqr < minSnapDistance*minSnapDistance) {
				transform.position = targetPosition;
				moving = false;
			}
			return;
		}
		
		//If the player is turning, handle the turn and don't accept keyboard input
		if (turning) {
			//rotate towards the target rotation
			transform.rotation = Quaternion.Lerp(transform.rotation, targetRotation, Time.deltaTime * turnRate);
			//check to see if we're close enough to snap to the target rotation
			var remainingTurnAngle: float = Quaternion.Angle(transform.rotation, targetRotation);
			if (remainingTurnAngle < minSnapAngle) 
			{
				transform.rotation = targetRotation;
				turning = false;
			}
			return;
		}

		// Pressing L opens/closes the Quest Log
		if (Input.GetKeyUp(KeyCode.L))
		{
			scrQuestLog.showQuestLog = !scrQuestLog.showQuestLog;
		}
		// Pressing I opens/closes the Inventory
		if (Input.GetKeyUp(KeyCode.I))
		{
			// set the GUI variable to match		
			scrInventoryManager.showInventory = !scrInventoryManager.showInventory;
		}
	
		
		//Handle Keyboard input
		if(Input.GetKey(KeyCode.W) || Input.GetKey(KeyCode.UpArrow)) {
			if (_navigator.Move(Direction.Forward)) {
				targetPosition = _navigator.CurrentPosition();
				moving = true;
			} else {
				if (!audio.isPlaying) {
					audio.Play();
				}
			}
		} else if(Input.GetKey(KeyCode.E)) {
			if (_navigator.Move(Direction.Right)) {
				targetPosition = _navigator.CurrentPosition();
				moving = true;
			} else {
				if (!audio.isPlaying) {
					audio.Play();
				}
			}
		} else if(Input.GetKey (KeyCode.S) || Input.GetKey(KeyCode.DownArrow)) {
			if (_navigator.Move (Direction.Backward)) {
				targetPosition = _navigator.CurrentPosition();
				moving = true;
			} else {
				if (!audio.isPlaying) {
					audio.Play();
				}
			}
		} else if(Input.GetKey(KeyCode.Q)) {
			if (_navigator.Move (Direction.Left)) {
				targetPosition = _navigator.CurrentPosition();
				moving = true;
			} else {
				if (!audio.isPlaying) {
					audio.Play();
				}
			}
		} else if(Input.GetKey (KeyCode.A) || Input.GetKey(KeyCode.LeftArrow)) {
			_navigator.Turn (Direction.Left);
			targetRotation = Quaternion.LookRotation(_navigator.CurrentFacing(), _navigator.CurrentUpVector());
			turning = true;
		} else if(Input.GetKey (KeyCode.D) || Input.GetKey(KeyCode.RightArrow)) {
			_navigator.Turn (Direction.Right);
			targetRotation = Quaternion.LookRotation(_navigator.CurrentFacing(), _navigator.CurrentUpVector());
			turning = true;
		}
	}
	
	private function CheckMouseLook() {
		//check right mouse button
		if(Input.GetKeyDown(KeyCode.Mouse1)) {
			cameraState = CameraStates.MouseLook;
		} else if (Input.GetKeyUp(KeyCode.Mouse1)) {
			cameraState = CameraStates.Returning;
			// rotationVertical is cumulative, so have to reset it to 0 here
			rotationVertical = 0;			
		}
	

	
		//If mouse look is enabled, position the camera
		if (cameraState == CameraStates.MouseLook && characterCamera) {
			HandleMouseLook();
		}
	
		//if the camera is returning 
		if (cameraState == CameraStates.Returning) {
			characterCamera.rotation = Quaternion.Lerp (characterCamera.rotation, transform.rotation, Time.deltaTime * turnRate);
		
			var angle: float = Vector3.Angle(characterCamera.forward, transform.forward);
			if (angle < minSnapAngle) {
				characterCamera.rotation = transform.rotation;
				cameraState = CameraStates.Locked;
			}
		}
	}
	
	private function CheckMouseClick() {

	    if(Input.GetKeyDown(KeyCode.Mouse0))
	    {
	    	// if they clicked on anything EXCEPT the ground, just get out
	    	if(Physics.Raycast(characterCamera.camera.ScreenPointToRay(Input.mousePosition), hit))
	    	{
	    		// if whatever was clicked on does not have a script attached to it, ignore the click
	    		if (hit.transform.gameObject.GetComponent(QuestItem) == null) {
	    			return;
	    		}
	    			
	    		if (hit.distance > 3)
	    		{
	    			scrQuestItem = hit.transform.gameObject.GetComponent(QuestItem);
	    			Debug.Log("Too far away to pick up " + scrQuestItem.itemName + ".");
	    		}
	    		else
	    		{
		    		var tmpObject: GameObject = hit.transform.gameObject;
		    		scrQuestItem = tmpObject.GetComponent(QuestItem);
		    		// if its an item, add it to inventory
		    		if (scrQuestItem.itemType == "item") {
			    		scrInventoryManager.Inventory.AddToInventory(hit);
			    	}
			    	else if (scrQuestItem.itemType == "door")
			    	{
			    		// check if it is locked. If not, open it
			    		if (scrQuestItem.status == "unlocked") {
			    			tmpObject.renderer.material = Resources.Load(scrQuestItem.newMaterial) as Material;
							scrQuestLog.EvaluateStatus(scrQuestItem.questId);
			    		}
			    		else {
			    			// if we have the key, unlock and open the door
			    			if (scrInventoryManager.Inventory.aryInventory.Contains(scrQuestItem.requirement))
			    			{
			    				scrQuestItem.status = "unlocked";
								tmpObject.renderer.material = Resources.Load(scrQuestItem.newMaterial) as Material;
								scrQuestLog.EvaluateStatus(scrQuestItem.questId);
							}
			    		}
			    	} // end else if (scrQuestItem.itemType == "door")
	    		}  // end else.  if (hit.distance > 2)
			} // end if(Physics.Raycast(characterCamera.camera.ScreenPointToRay(Input.mousePosition), hit))
		} // end if(Input.GetKeyDown(KeyCode.Mouse0))
	}
	
	//This method will position the camera based on how the mouse is moved
	private function HandleMouseLook() {
		rotationHorizontal = characterCamera.localEulerAngles.y + Input.GetAxis("Mouse X") * sensitivityX;
	
		rotationVertical += Input.GetAxis("Mouse Y") * sensitivityY;
	
		// left goes from 360 down
		if (maxLookLeft > 0 && rotationHorizontal > 90) {
			if (rotationHorizontal < (360-maxLookLeft))
				rotationHorizontal = (360-maxLookLeft);
		}
		// right goes from 0 up
		if (maxLookRight > 0 && rotationHorizontal < 90) {
			if (rotationHorizontal > maxLookRight)
				rotationHorizontal = maxLookRight;
		}

		// up is positive...
		if (maxLookUp > 0 && rotationVertical > 0) {
			if (rotationVertical > maxLookUp)
				rotationVertical = maxLookUp;
		}
		// down is negative	
		if (maxLookDown > 0 && rotationVertical < 0) {
			if (rotationVertical < maxLookDown*(-1))
				rotationVertical = maxLookDown*(-1);
		}
	
		characterCamera.localEulerAngles = Vector3(-rotationVertical, rotationHorizontal, 0);
	}
}
