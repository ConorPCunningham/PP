
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, SafeAreaView, Animated, Easing, Dimensions, Alert } from 'react-native';
import { Audio } from 'expo-av';
import ConfettiCannon from 'react-native-confetti-cannon';
import * as Progress from 'react-native-progress';

const { width, height } = Dimensions.get('window');
const colors = { bg:'#F6F9FF', card:'#FFFFFF', text:'#1F2D3D', primary:'#5A67FF', accent:'#FF9F1C', pee:'#4FC3F7', poop:'#A0522D' };

export default function App(){
  const [screen,setScreen] = useState('splash');
  const [stars,setStars] = useState(0);
  const [badge,setBadge] = useState(0);
  const [log,setLog] = useState([]);
  const [showConfetti,setShowConfetti] = useState(false);
  const [game,setGame] = useState(null); // flush | bubbles | tp
  const [soundObj,setSoundObj] = useState(null);
  useEffect(()=>()=>{ if(soundObj) soundObj.unloadAsync(); },[soundObj]);

  // Splash anim
  const float = useRef(new Animated.Value(0)).current;
  const wiggle = useRef(new Animated.Value(0)).current;
  const scale  = useRef(new Animated.Value(1)).current;
  useEffect(()=>{
    if(screen==='splash'){
      Animated.loop(Animated.sequence([
        Animated.timing(float,{toValue:1,duration:1000,useNativeDriver:true}),
        Animated.timing(float,{toValue:0,duration:1000,useNativeDriver:true})
      ])).start();
      Animated.loop(Animated.sequence([
        Animated.timing(wiggle,{toValue:1,duration:900,useNativeDriver:true}),
        Animated.timing(wiggle,{toValue:-1,duration:900,useNativeDriver:true}),
        Animated.timing(wiggle,{toValue:0,duration:900,useNativeDriver:true})
      ])).start();
      play(require('./assets/intro.mp3'));
      setTimeout(()=>setScreen('home'), 3000);
    }
  },[screen]);

  const play = async (asset, opts={})=>{
    try{ const {sound} = await Audio.Sound.createAsync(asset,{shouldPlay:true,...opts}); setSoundObj(sound); }catch(e){}
  };

  const Pressy = ({children,onPress,style})=>{
    const s = useRef(new Animated.Value(1)).current;
    return (
      <Animated.View style={[{transform:[{scale:s}]}, style]}>
        <TouchableOpacity
          activeOpacity={0.9}
          onPressIn={()=>Animated.spring(s,{toValue:0.94,useNativeDriver:true,friction:6}).start()}
          onPressOut={()=>Animated.spring(s,{toValue:1.0,useNativeDriver:true,friction:6}).start()}
          onPress={onPress}
        >{children}</TouchableOpacity>
      </Animated.View>
    );
  };

  const addStars = (n=1)=>{
    const prev = stars, ns = prev + n;
    setStars(ns);
    if(Math.floor(ns/5) > Math.floor(prev/5)){
      setBadge(b=>b+1); setShowConfetti(true); play(require('./assets/fanfare.mp3')); setTimeout(()=>setShowConfetti(false),2200);
    }
  };

  const onPee = async()=>{ addStars(1); setLog([{type:'pee',ts:Date.now()},...log]); await play(require('./assets/song.mp3')); setScreen('celeb'); };
  const onPoop= async()=>{ addStars(2); setLog([{type:'poop',ts:Date.now()},...log]); await play(require('./assets/victory.mp3')); setScreen('celeb'); };

  // Potty Time
  const [calm,setCalm] = useState(0);
  useEffect(()=>{
    let t; if(screen==='potty'){ setCalm(0); play(require('./assets/calm.mp3'),{isLooping:true}); t=setInterval(()=>setCalm(p=>Math.min(1,p+0.02)),2000); }
    return ()=> t && clearInterval(t);
  },[screen]);

  // Games
  const [score,setScore]=useState(0); const [timer,setTimer]=useState(0);
  const [villains,setVillains]=useState([]); const [bubbles,setBubbles]=useState([]);
  const [tpProgress,setTpProgress]=useState(0); const [tpTick,setTpTick]=useState(null);

  useEffect(()=>{ let t; if(screen==='game'&&game){ setScore(0); setTimer(20); t=setInterval(()=>setTimer(x=>x<=1?0:x-1),1000);} return ()=>t&&clearInterval(t); },[screen,game]);
  useEffect(()=>{
    if(screen==='game'&&game==='flush'){ setVillains(Array.from({length:5}).map((_,i)=>({id:i,x:Math.random()*(width-100),y:Math.random()*(height*0.45)+140}))); }
    if(screen==='game'&&game==='bubbles'){ setBubbles(Array.from({length:12}).map((_,i)=>({id:i,x:Math.random()*(width-80),y:Math.random()*200+height*0.4}))); }
    if(screen==='game'&&game==='tp'){ setTpProgress(0); }
  },[screen,game]);

  const hitVillain = (id)=>{ setScore(s=>s+1); play(require('./assets/flush.mp3')); setVillains(vs=>vs.map(v=>v.id===id?{...v,x:Math.random()*(width-100),y:Math.random()*(height*0.45)+140}:v)); };
  const popBubble = (id)=>{ setScore(s=>s+1); play(require('./assets/pop.mp3')); setBubbles(bs=>bs.map(b=>b.id===id?{...b,x:Math.random()*(width-80),y:Math.random()*200+height*0.4}:b)); };
  const onTPPressIn = ()=>{ const t=setInterval(()=>setTpProgress(p=>{ const np=Math.min(1,p+0.05); if(np>=1){ clearInterval(t); play(require('./assets/unravel.mp3')); setScore(s=>s+5);} return np; }),150); setTpTick(t); };
  const onTPPressOut = ()=>{ if(tpTick) clearInterval(tpTick); setTpTick(null); };
  const resetGame = ()=>{ setGame(null); setScreen('home'); };

  const Header = ()=>(
    <View style={styles.header}>
      <Progress.Bar progress={(stars%5)/5} width={width*0.6} height={14} color={colors.primary} unfilledColor="#E9EEFF" borderWidth={0} />
      <Text style={styles.headerText}>Stars: {stars} • Badge: {badge}</Text>
    </View>
  );
  const Card = ({title,children})=>(<View style={styles.card}>{title?<Text style={styles.cardTitle}>{title}</Text>:null}{children}</View>);
  const BigButton = ({title,onPress,color})=>(<Pressy onPress={onPress} style={[styles.bigBtn,{backgroundColor:color||colors.primary}]}><Text style={styles.bigBtnText}>{title}</Text></Pressy>);

  if(screen==='splash'){
    return (
      <SafeAreaView style={styles.splash}>
        <Animated.Image source={require('./assets/captain-pottypants-hero-splash.png')} style={[styles.heroSplash,{
          transform:[
            { translateY: float.interpolate({inputRange:[0,1],outputRange:[0,-10]}) },
            { rotate: wiggle.interpolate({inputRange:[-1,0,1],outputRange:['-3deg','0deg','3deg']}) },
            { scale }
          ]
        }]} />
        <Text style={styles.splashTitle}>To Potty and Beyond!</Text>
      </SafeAreaView>
    );
  }

  if(screen==='home'){
    return (
      <SafeAreaView style={styles.container}>
        <Header />
        <View style={{alignItems:'center'}}>
          <TouchableOpacity onPress={()=>{ Animated.sequence([Animated.spring(scale,{toValue:1.12,useNativeDriver:true,friction:3}), Animated.spring(scale,{toValue:1.0,useNativeDriver:true,friction:4})]).start(); play(require('./assets/easter.mp3')); }}>
            <Animated.Image source={require('./assets/captain-pottypants-hero.png')} style={styles.hero} />
          </TouchableOpacity>
        </View>

        <Card title="Choose an action">
          <View style={styles.row}>
            <BigButton title="I went Pee 💧" color={colors.pee} onPress={onPee} />
            <BigButton title="I went Poop 💩" color={colors.poop} onPress={onPoop} />
          </View>
          <View style={styles.row}>
            <BigButton title="Potty Time ⏳" color={colors.accent} onPress={()=>setScreen('potty')} />
            <BigButton title="Mini‑Games 🎮" onPress={()=>{ setGame(null); setScreen('games'); }} />
          </View>
        </Card>

        <View style={styles.footerRow}>
          <BigButton title="Parent Dashboard" color="#8E44AD" onPress={()=>setScreen('parent')} />
          <BigButton title="Rewards" color="#27AE60" onPress={()=>Alert.alert('Rewards','Earn stars to unlock badges and outfits!')} />
        </View>

        {showConfetti && (<><ConfettiCannon count={90} origin={{x: width*0.1, y: 0}} fadeOut /><ConfettiCannon count={90} origin={{x: width*0.9, y: 0}} fadeOut /></>)}
      </SafeAreaView>
    );
  }

  if(screen==='celeb'){
    return (
      <SafeAreaView style={styles.containerCenter}>
        <Text style={styles.title}>Great job, hero!</Text>
        <Image source={require('./assets/captain-pottypants-hero.png')} style={styles.hero} />
        <BigButton title="Back to Home" onPress={()=>setScreen('home')} />
        <ConfettiCannon count={120} origin={{x: width*0.8, y: 0}} fadeOut />
      </SafeAreaView>
    );
  }

  if(screen==='potty'){
    return (
      <SafeAreaView style={styles.container}>
        <Header />
        <Card title="Potty Time — Relax…">
          <Text style={styles.subtitle}>Breathe in… and out… tap bubbles while you wait.</Text>
          <View style={{alignItems:'center', marginTop: 8}}>
            <Progress.Circle progress={calm} size={120} showsText formatText={()=>`${Math.round(calm*100)}%`} color={colors.accent} />
          </View>
        </Card>
        <Card title="Calm Bubbles">
          <View style={{ flexDirection:'row', flexWrap:'wrap', justifyContent:'center' }}>
            {Array.from({ length: 10 }).map((_,i) => (
              <TouchableOpacity key={i} onPress={()=>play(require('./assets/pop.mp3'))}
                style={{ width:60, height:60, borderRadius:30, backgroundColor:'#dfefff', margin:10, alignItems:'center', justifyContent:'center', borderWidth:2, borderColor:'#b9d4ff' }}>
                <Text style={{ color:'#4F7DF3', fontWeight:'700' }}>POP</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>
        <View style={styles.footerRow}><BigButton title="Done" onPress={()=>setScreen('home')} /></View>
      </SafeAreaView>
    );
  }

  if(screen==='games' && !game){
    return (
      <SafeAreaView style={styles.container}>
        <Header />
        <Card title="Mini‑Games">
          <View style={styles.row}>
            <BigButton title="Flush the Villain 🚽" onPress={()=>{ setGame('flush'); setScreen('game'); }} />
            <BigButton title="Bubble Pop 🫧" onPress={()=>{ setGame('bubbles'); setScreen('game'); }} />
          </View>
          <View style={styles.row}>
            <BigButton title="TP Unroll 🧻" onPress={()=>{ setGame('tp'); setScreen('game'); }} />
            <BigButton title="Back" color="#95A5A6" onPress={()=>setScreen('home')} />
          </View>
        </Card>
      </SafeAreaView>
    );
  }

  if(screen==='game'){
    return (
      <SafeAreaView style={styles.container}>
        <Header />
        <Card title={game==='flush' ? 'Flush the Villain' : game==='bubbles' ? 'Bubble Pop' : 'TP Unroll'}>
          <Text style={styles.subtitle}>Time: {timer}s   Score: {score}</Text>

          {game==='flush' && (
            <View style={{ width:'100%', height: height*0.45, marginTop: 10 }}>
              {villains.map(v => (
                <TouchableOpacity key={v.id} onPress={()=>hitVillain(v.id)} style={{ position:'absolute', left:v.x, top:v.y }}>
                  <Image source={require('./assets/villain.png')} style={{ width: 70, height: 70 }} />
                </TouchableOpacity>
              ))}
            </View>
          )}

          {game==='bubbles' && (
            <View style={{ width:'100%', height: height*0.45, marginTop: 10 }}>
              {bubbles.map(b => (
                <TouchableOpacity key={b.id} onPress={()=>popBubble(b.id)} style={{ position:'absolute', left:b.x, top:b.y }}>
                  <Image source={require('./assets/bubble.png')} style={{ width: 60, height: 60, opacity: 0.9 }} />
                </TouchableOpacity>
              ))}
            </View>
          )}

          {game==='tp' && (
            <View style={{ alignItems:'center', marginTop: 20 }}>
              <Image source={require('./assets/tp.png')} style={{ width: 120, height: 160, marginBottom: 20 }} />
              <TouchableOpacity onPressIn={onTPPressIn} onPressOut={onTPPressOut}
                style={{ padding: 20, backgroundColor:'#fff3cd', borderRadius: 16, borderWidth: 2, borderColor:'#ffe58f' }}>
                <Text style={{ fontWeight:'700', color:'#b8860b' }}>Press and Hold to Unroll</Text>
              </TouchableOpacity>
              <View style={{ marginTop: 16 }}>
                <Progress.Bar progress={tpProgress} width={220} height={12} color="#f1c40f" />
              </View>
            </View>
          )}
        </Card>
        <View style={styles.footerRow}><BigButton title="End Game" color="#95A5A6" onPress={resetGame} /></View>
      </SafeAreaView>
    );
  }

  if(screen==='parent'){
    return (
      <SafeAreaView style={styles.container}>
        <Header />
        <Card title="Parent Dashboard">
          <Text style={styles.subtitle}>Streak: {stars}  •  Total events: {log.length}</Text>
          <View style={{ marginTop: 8 }}>
            {log.length === 0 ? <Text>No logs yet.</Text> : log.slice(0,10).map((e,i)=>(
              <Text key={i} style={{ marginVertical: 2 }}>{new Date(e.ts).toLocaleString()} — {e.type}</Text>
            ))}
          </View>
        </Card>
        <View style={styles.footerRow}><BigButton title="Back" color="#95A5A6" onPress={()=>setScreen('home')} /></View>
      </SafeAreaView>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  splash:{ flex:1, backgroundColor:'#E8F0FF', alignItems:'center', justifyContent:'center' },
  splashTitle:{ fontSize:26, fontWeight:'800', color:'#5A67FF', marginTop:16 },
  container:{ flex:1, backgroundColor: colors.bg, padding:16 },
  containerCenter:{ flex:1, backgroundColor: colors.bg, alignItems:'center', justifyContent:'center', padding:16 },
  header:{ alignItems:'center', marginBottom:10 },
  headerText:{ marginTop:6, color:colors.text, fontWeight:'700' },
  hero:{ width:220, height:220, resizeMode:'contain', alignSelf:'center' },
  heroSplash:{ width:220, height:220, resizeMode:'contain' },
  title:{ fontSize:28, fontWeight:'800', color:colors.text, textAlign:'center', marginBottom:10 },
  subtitle:{ fontSize:14, color:'#5D6D7E', marginTop:6 },
  card:{ backgroundColor:colors.card, padding:16, borderRadius:20, marginTop:12, shadowColor:'#000', shadowOpacity:0.08, shadowRadius:10, elevation:2 },
  cardTitle:{ fontSize:18, fontWeight:'800', color:colors.text, marginBottom:10 },
  row:{ flexDirection:'row' },
  bigBtn:{ flex:1, paddingVertical:16, margin:6, borderRadius:16, alignItems:'center', justifyContent:'center', shadowColor:'#000', shadowOpacity:0.08, shadowRadius:6, elevation:1 },
  bigBtnText:{ fontSize:16, color:'#fff', fontWeight:'800', textAlign:'center' },
  footerRow:{ flexDirection:'row', marginTop:10 },
});
