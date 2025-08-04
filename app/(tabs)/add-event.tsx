import { View } from "react-native";
import { SegmentedButtons, TextInput } from "react-native-paper";




export default function AddEventScreen() {
    return (
        <View>
            <TextInput label="Event Name"  mode="outlined" />
            <TextInput label="Description"  mode="outlined" />
            <View>
                <SegmentedButtons  buttons={[
                    {value:"private", label:"Private"},
                    {value:"public", label:"Public"}
                    ]} />
            </View>  
        </View>
    )
}