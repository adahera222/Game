#pragma strict

public interface INavigator {
	function CurrentPosition(): Vector3;
	function CurrentFacing(): Vector3;
	function CurrentUpVector(): Vector3
	function ConnectMap(map: IMap);
	function Move(direction: Direction): boolean;
	function Turn(direction: Direction);
}