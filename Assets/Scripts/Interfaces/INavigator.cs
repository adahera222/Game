using UnityEngine;

public interface INavigator {
	Vector3 CurrentPosition { get; }
	Vector3 CurrentFacing { get; }
	Vector3 CurrentUpVector { get; }
	void ConnectMap(IMap map);
	bool Move(Direction direction);
	void Turn(Direction direction);
}
