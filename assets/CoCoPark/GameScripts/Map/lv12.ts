// 第5关地图数据和汽车数据
import { _decorator } from 'cc';
const { ccclass } = _decorator;

@ccclass('Level12Map')
export class Level12Map {
    public static MapW: number = 5;
    public static MapH: number = 6;
    public static Map: number[][] = [
        [0, 0, 0, 0, 0],
        [0,-2, 0, 0, 0],
        [0, 0,-3, 0, 0],
        [0, 0,-3, 0, 0],
        [0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0]
    ];

    // 汽车数据
    public static CarData: {outerMap: string, sort: number, type: number, inPark: number}[] = [
        {outerMap: 'U2', sort: 0, type: 4, inPark: 0},
        {outerMap: 'U3', sort: 0, type: 4, inPark: 0},
        {outerMap: 'L1', sort: 0, type: 4, inPark: 0},
        {outerMap: 'L2', sort: 0, type: 4, inPark: 0},
        {outerMap: 'R2', sort: 0, type: 4, inPark: 0},
        {outerMap: 'R3', sort: 0, type: 4, inPark: 0}
    ];
}