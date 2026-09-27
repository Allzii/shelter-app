import { Text, View, StyleSheet, TextInput } from "react-native";

export default function NeedsHelpScreen() {

    return (
        <View style={styles.container}>
            <Text style={styles.title}>
                Jag behöver hjälp
            </Text>

            <Text style={styles.description}>
                För att använda TryggNära behöver vi först verifiera din identitet.
            </Text>

            <Text style={styles.Namelabel}>För- och efternamn</Text>
            <TextInput style={styles.Nameinput} placeholder="Skriv ditt namn" />

            <Text style={styles.PhoneNumberlabel}>Telefonnummer</Text>
            <TextInput style={styles.PhoneNumberinput} placeholder="Skriv ditt telefonnummer" />

            <Text style={styles.Addresslabel}>Address</Text>
            <TextInput style={styles.Addressinput} placeholder="Skriv in din address" />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#EEF4F7",
        paddingHorizontal: 28,
        paddingTop: 60,
    },

    title: {
        fontSize: 30,
        fontWeight: "700",
        color: "#142235",
    },

    description: {
        fontSize: 16,
        color: "#142235",
    },

    Namelabel: {
        fontSize: 16,
        color: "#142235",
        marginTop: 20,
    },

    PhoneNumberlabel: {
        fontSize: 16,
        color: "#142235",
        marginTop: 20,
    },

    Addresslabel: {
        fontSize: 16,
        color: "#142235",
        marginTop: 20,
    },

    Nameinput: {
        backgroundColor: "#FFFFFF",
        marginTop: 100,
        height: 56,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: "#CCCCCC",
    },

    PhoneNumberinput: {
        backgroundColor: "#FFFFFF",
        marginTop: 20,
        height: 56,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: "#CCCCCC",
    },

    Addressinput: {
        backgroundColor: "#FFFFFF",
        marginTop: 20,
        height: 56,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: "#CCCCCC",
    },
});