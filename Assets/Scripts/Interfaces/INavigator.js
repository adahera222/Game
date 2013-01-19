#pragma strict

public interface INavigator {
	function get CurrentPosition(): Vector3;
	function get CurrentFacing(): Vector3;
	function get CurrentUpVector(): Vector3
	function ConnectMap(map: IMap);
	function Move(direction: Direction): boolean;
	function Turn(direction: Direction);
}