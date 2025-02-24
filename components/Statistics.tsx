import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, TouchableOpacity } from 'react-native';
import { doc, onSnapshot, collection, query } from 'firebase/firestore';
import { db } from '@/firebaseConfig';
import { LineChart } from 'react-native-chart-kit';

type PeriodType = 'hourly' | 'daily' | 'monthly' | 'yearly';

const Statistics: React.FC = () => {
  const [todayQueue, setTodayQueue] = useState(0);
  const [ratingStats, setRatingStats] = useState<{ [rating: string]: number }>({});
  const [concernStats, setConcernStats] = useState<{ [concern: string]: number }>({});
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('daily');
  const [dailyConcernData, setDailyConcernData] = useState<{
    [concern: string]: {
      [date: string]: number
    }
  }>({});

  useEffect(() => {
    const ratingsRef = collection(db, 'ratings');
    const ratingsUnsubscribe = onSnapshot(query(ratingsRef), (snapshot) => {
      const concerns: { [key: string]: number } = {};
      const dailyData: { [concern: string]: { [date: string]: number } } = {};
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        const concern = data.concern;
        const timestamp = data.timestamp?.toDate();
        
        if (concern && timestamp) {
          concerns[concern] = (concerns[concern] || 0) + 1;
          
          const dateStr = timestamp.toISOString();
          if (!dailyData[concern]) {
            dailyData[concern] = {};
          }
          dailyData[concern][dateStr] = (dailyData[concern][dateStr] || 0) + 1;
        }
      });
      const ratings: { [key: string]: number } = {
        'User Experience': 0,
        'Navigation': 0,
        'Performance': 0,
        'Design': 0,
        'Stability': 0,
        'Overall': 0
      };
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        const surveyAnswers = data.surveyAnswers;
        
        if (surveyAnswers) {
          ratings['User Experience'] += surveyAnswers.userExperience || 0;
          ratings['Navigation'] += surveyAnswers.navigation || 0;
          ratings['Performance'] += surveyAnswers.performance || 0;
          ratings['Design'] += surveyAnswers.design || 0;
          ratings['Stability'] += surveyAnswers.stability || 0;
          ratings['Overall'] += data.overallRating || 0;
        }
      });const docCount = snapshot.size || 1;
      Object.keys(ratings).forEach(key => {
        ratings[key] = ratings[key] / docCount;
      });
      
      setRatingStats(ratings);
      setConcernStats(concerns);
      setDailyConcernData(dailyData);
    });

    const queueCounterRef = doc(db, 'admin', 'QueueCounter');
    const queueUnsubscribe = onSnapshot(queueCounterRef, (doc) => {
      if (doc.exists()) {
        setTodayQueue(doc.data().today_queue);
      }
    });

    return () => {
      ratingsUnsubscribe();
      queueUnsubscribe();
    };
  }, []);

  const getLineChartData = (concernType: string) => {
    const now = new Date();
    let labels: { label: string; timestamp: Date }[] = [];

    switch(selectedPeriod) {
      case 'hourly':
        labels = Array.from({length: 24}, (_, i) => {
          const date = new Date(now);
          date.setHours(i, 0, 0, 0);
          return {
            label: `${i.toString().padStart(2, '0')}:00`,
            timestamp: date
          };
        });
        break;
      case 'daily':
        labels = Array.from({length: 30}, (_, i) => {
          const date = new Date(now);
          date.setDate(date.getDate() - i);
          return {
            label: `${date.getDate()}/${date.getMonth() + 1}`,
            timestamp: date
          };
        }).reverse();
        break;
      case 'monthly':
        labels = Array.from({length: 12}, (_, i) => {
          const date = new Date(now);
          date.setMonth(date.getMonth() - i);
          return {
            label: date.toLocaleString('default', { month: 'short' }),
            timestamp: date
          };
        }).reverse();
        break;
      case 'yearly':
        labels = Array.from({length: 5}, (_, i) => {
          const date = new Date(now);
          date.setFullYear(date.getFullYear() - i);
          return {
            label: date.getFullYear().toString(),
            timestamp: date
          };
        }).reverse();
        break;
    }

    const dataPoints = labels.map(({label, timestamp}) => {
      return (dailyConcernData[concernType] && 
        Object.entries(dailyConcernData[concernType])
          .filter(([dateStr]) => {
            const date = new Date(dateStr);
            switch(selectedPeriod) {
              case 'hourly':
                return date.getHours() === timestamp.getHours() && 
                       date.getDate() === timestamp.getDate() &&
                       date.getMonth() === timestamp.getMonth() &&
                       date.getFullYear() === timestamp.getFullYear();
              case 'daily':
                return date.getDate() === timestamp.getDate() &&
                       date.getMonth() === timestamp.getMonth() &&
                       date.getFullYear() === timestamp.getFullYear();
              case 'monthly':
                return date.getMonth() === timestamp.getMonth() &&
                       date.getFullYear() === timestamp.getFullYear();
              case 'yearly':
                return date.getFullYear() === timestamp.getFullYear();
            }
          })
          .reduce((sum, [_, count]) => sum + count, 0)
      ) || 0;
    });

    return {
      labels: labels.map(l => l.label),
      datasets: [{
        data: dataPoints
      }]
    };
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Statistics Dashboard</Text>
      
      <View style={styles.counterCard}>
        <Text style={styles.counterTitle}>Today's Queue</Text>
        <Text style={styles.counterValue}>{todayQueue}</Text>
      </View>

      

      <View style={styles.graphContainer}>
        <Text style={styles.graphTitle}>Concerns Distribution</Text>
        <View style={styles.graph}>
          {Object.entries(concernStats).map(([concern, count], index) => (
            <View key={index} style={styles.barContainer}>
              <View style={[styles.bar, { 
                height: count > 0 ? (count / Math.max(...Object.values(concernStats))) * 200 : 0,
                backgroundColor: `hsl(${index * (360 / Object.keys(concernStats).length)}, 70%, 60%)`
              }]} />
              <Text style={styles.barLabel}>{concern}</Text>
              <Text style={styles.barValue}>{count}</Text>
            </View>
          ))}
        </View>
      </View>
      <View style={styles.selectorContainer}>
        <TouchableOpacity 
          style={[styles.selectorButton, selectedPeriod === 'hourly' && styles.selectedButton]}
          onPress={() => setSelectedPeriod('hourly')}
        >
          <Text style={[styles.selectorText, selectedPeriod === 'hourly' && styles.selectedText]}>Hourly</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.selectorButton, selectedPeriod === 'daily' && styles.selectedButton]}
          onPress={() => setSelectedPeriod('daily')}
        >
          <Text style={[styles.selectorText, selectedPeriod === 'daily' && styles.selectedText]}>Daily</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.selectorButton, selectedPeriod === 'monthly' && styles.selectedButton]}
          onPress={() => setSelectedPeriod('monthly')}
        >
          <Text style={[styles.selectorText, selectedPeriod === 'monthly' && styles.selectedText]}>Monthly</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.selectorButton, selectedPeriod === 'yearly' && styles.selectedButton]}
          onPress={() => setSelectedPeriod('yearly')}
        >
          <Text style={[styles.selectorText, selectedPeriod === 'yearly' && styles.selectedText]}>Yearly</Text>
        </TouchableOpacity>
      </View>
      {Object.keys(concernStats).map((concern, index) => (
        <View key={`line-${index}`} style={styles.lineChartContainer}>
          <Text style={styles.lineChartTitle}>{concern} - {selectedPeriod.charAt(0).toUpperCase() + selectedPeriod.slice(1)} Trend</Text>
          <LineChart
            data={getLineChartData(concern)}
            width={Dimensions.get('window').width - 200}
            height={220}
            chartConfig={{
              backgroundColor: '#ffffff',
              backgroundGradientFrom: '#ffffff',
              backgroundGradientTo: '#ffffff',
              decimalPlaces: 0,
              color: (opacity = 1) => `hsl(${index * (360 / Object.keys(concernStats).length)}, 70%, 60%, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              style: {
                borderRadius: 16
              },
              propsForDots: {
                r: "6",
                strokeWidth: "2",
                stroke: "#ffa726"
              }
            }}
            bezier
            style={styles.lineChart}
          />
        </View>
      ))}

    <View style={styles.graphContainer}>
      <Text style={styles.graphTitle}>Average Ratings Distribution</Text>
      <View style={styles.graph}>
        {Object.entries(ratingStats).map(([category, avgRating], index) => (
          <View key={index} style={styles.barContainer}>
            <View style={[styles.bar, { 
              height: (avgRating / 5) * 200,  // Scale to 200px max height
              backgroundColor: `hsl(${index * (360 / Object.keys(ratingStats).length)}, 70%, 60%)`
            }]} />
            <Text style={styles.barLabel}>{category}</Text>
            <Text style={styles.barValue}>{avgRating.toFixed(1)}</Text>
          </View>
        ))}
      </View>
    </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  selectorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  selectorButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginHorizontal: 5,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
  },
  selectedButton: {
    backgroundColor: '#007AFF',
  },
  selectorText: {
    color: '#333',
    fontSize: 14,
  },
  selectedText: {
    color: '#fff',
  },
  counterCard: {
    backgroundColor: '#f5f5f5',
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
  },
  counterTitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 10,
  },
  counterValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  graphContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
  },
  graphTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  graph: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 250,
  },
  barContainer: {
    alignItems: 'center',
    width: 80,
  },
  bar: {
    width: 40,
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
  },
  barLabel: {
    fontSize: 12,
    marginTop: 5,
    textAlign: 'center',
  },
  barValue: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 5,
  },
  lineChartContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
  },
  lineChartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  lineChart: {
    marginVertical: 8,
    borderRadius: 16,
  }
});

export default Statistics;
