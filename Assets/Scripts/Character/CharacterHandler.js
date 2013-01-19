public enum CameraStates {Locked, Returning, MouseLook};

public class CharacterHandler extends MonoBehaviour {
	
	//the map that this character is currently in
	private var _map: IMap;
	
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
	
	public function PlaceInMap(newMap: IMap) {
		//store a reference to the map
		_map = newMap;
		//position this gameobject using the map's navigator
		transform.position = _map.Navigator.CurrentPosition;
		transform.rotation = Quaternion.LookRotation(_map.Navigator.CurrentFacing, _map.Navigator.CurrentUpVector);
	}
	
	public function Start () {
		characterCamera = transform.Find("Camera");
	}
	
	// Update is called once per frame
	public function Update () {
		//don't do anything until a valid map is hooked to this handler
		if ( _map == null ) { return; }
		
		//check to see if the user is "Mouse" looking
		CheckMouseLook();
		
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

		
		//Handle Keyboard input
		if(Input.GetKey(KeyCode.W) || Input.GetKey(KeyCode.UpArrow)) {
			if (_map.Navigator.Move(Direction.Forward)) {
				targetPosition = _map.Navigator.CurrentPosition;
				moving = true;
			}
		} else if(Input.GetKey(KeyCode.E)) {
			if (_map.Navigator.Move(Direction.Right)) {
				targetPosition = _map.Navigator.CurrentPosition;
				moving = true;
			}
		} else if(Input.GetKey (KeyCode.S) || Input.GetKey(KeyCode.DownArrow)) {
			if (_map.Navigator.Move (Direction.Backward)) {
				targetPosition = _map.Navigator.CurrentPosition;
				moving = true;
			}
		} else if(Input.GetKey(KeyCode.Q)) {
			if (_map.Navigator.Move (Direction.Left)) {
				targetPosition = _map.Navigator.CurrentPosition;
				moving = true;
			}
		} else if(Input.GetKey (KeyCode.A) || Input.GetKey(KeyCode.LeftArrow)) {
			_map.Navigator.Turn (Direction.Left);
			targetRotation = Quaternion.LookRotation(_map.Navigator.CurrentFacing, _map.Navigator.CurrentUpVector);
			turning = true;
		} else if(Input.GetKey (KeyCode.D) || Input.GetKey(KeyCode.RightArrow)) {
			_map.Navigator.Turn (Direction.Right);
			targetRotation = Quaternion.LookRotation(_map.Navigator.CurrentFacing, _map.Navigator.CurrentUpVector);
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
