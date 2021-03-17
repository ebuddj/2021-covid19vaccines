import React, {Component} from 'react'
import style from './../styles/styles.less';

// https://underscorejs.org/
import _ from 'underscore';

// https://github.com/topojson/topojson
import * as topojson from 'topojson-client';

// https://www.npmjs.com/package/rc-slider
import Slider from 'rc-slider/lib/Slider';
import 'rc-slider/assets/index.css';
import './../styles/rc-slider-override.css';

// https://d3js.org/
import * as d3 from 'd3';

let interval, g, path;

// https://www.gps-coordinates.net/
const areaInfo = {"Albania": {"Lat":41.000028,"Long":19.9999619,"abbr":"AL"},"Andorra": {"Lat":42.5407167,"Long":1.5732033,"abbr":"AD"},"Armenia": {"Lat":40.7696272,"Long":44.6736646,"abbr":"AM"},"Austria": {"Lat":47.2000338,"Long":13.199959,"abbr":"AT"},"Azerbaijan": {"Lat":40.3936294,"Long":47.7872508,"abbr":"AZ"},"Belarus": {"Lat":53.4250605,"Long":27.6971358,"abbr":"BY"},"Belgium": {"Lat":50.6402809,"Long":4.6667145,"abbr":"BE"},"Bosnia and Herzegovina": {"Lat":44.3053476,"Long":17.5961467,"abbr":"BA"},"Bulgaria": {"Lat":42.6073975,"Long":25.4856617,"abbr":"BG"},"Croatia": {"Lat":45.5643442,"Long":17.0118954,"abbr":"HR"},"Cyprus": {"Lat":34.9823018,"Long":33.1451285,"abbr":"CY"},"Czechia": {"Lat":49.8167003,"Long":15.4749544,"abbr":"CZ"},"Denmark": {"Lat":55.670249,"Long":10.3333283,"abbr":"DK"},"Estonia": {"Lat":58.7523778,"Long":25.3319078,"abbr":"EE"},"Faeroe Islands": {"Lat":61.8982873,"Long":-7.5147032,"abbr":"FO"},"Finland": {"Lat":63.2467777,"Long":25.9209164,"abbr":"FI"},"France": {"Lat":46.603354,"Long":1.8883335,"abbr":"FR"},"Gibraltar": {"Lat":36.129508,"Long":-5.3708096,"abbr":"GI"},"Georgia": {"Lat":42,"Long":44.0287382,"abbr":"GE"},"Germany": {"Lat":51.0834196,"Long":10.4234469,"abbr":"DE"},"Greece": {"Lat":38.9953683,"Long":21.9877132,"abbr":"GR"},"Guernsey": {"Lat":49.4576584,"Long":-2.7511752,"abbr":"GG"},"Holy See": {"Lat":41.9038149,"Long":12.4531527,"abbr":"VA"},"Hungary": {"Lat":47.1817585,"Long":19.5060937,"abbr":"HU"},"Iceland": {"Lat":64.9841821,"Long":-18.1059013,"abbr":"IS"},"Ireland": {"Lat":52.865196,"Long":-7.9794599,"abbr":"IE"},"Isle of Man": {"Lat":54.2274815,"Long":-4.8523105,"abbr":"IM"},"Italy": {"Lat":42.6384261,"Long":12.674297,"abbr":"IT"},"Jersey": {"Lat":49.1650693,"Long":-2.4778001,"abbr":"JE"},"Kosovo": {"Lat":42.5869578,"Long":20.9021231,"abbr":"XK"},"Latvia": {"Lat":56.8406494,"Long":24.7537645,"abbr":"LV"},"Liechtenstein": {"Lat":47.1416307,"Long":9.5531527,"abbr":"LI"},"Lithuania": {"Lat":55.3500003,"Long":23.7499997,"abbr":"LT"},"Luxembourg": {"Lat":49.8158683,"Long":6.1296751,"abbr":"LU"},"Malta": {"Lat":35.8885993,"Long":14.4476911,"abbr":"MT"},"Moldova": {"Lat":47.2879608,"Long":28.5670941,"abbr":"MD"},"Monaco": {"Lat":43.7384402,"Long":7.4242474,"abbr":"MC"},"Montenegro": {"Lat":42.9868853,"Long":19.5180992,"abbr":"ME"},"Netherlands": {"Lat":52.5001698,"Long":5.7480821,"abbr":"NL"},"North Macedonia": {"Lat":41.512351989746094,"Long":21.751619338989258,"abbr":"MK"},"Norway": {"Lat":60.5000209,"Long":9.0999715,"abbr":"NO"},"Poland": {"Lat":52.215933,"Long":19.134422,"abbr":"PL"},"Portugal": {"Lat":40.0332629,"Long":-7.8896263,"abbr":"PT"},"Romania": {"Lat":45.9852129,"Long":24.6859225,"abbr":"RO"},"Russia": {"Lat":55.76158905029297,"Long":37.609458923339844,"abbr":"RU"},"San Marino": {"Lat":43.9458623,"Long":12.458306,"abbr":"SM"},"Serbia": {"Lat":44.0243228,"Long":21.0765743,"abbr":"RS"},"Slovakia": {"Lat":48.7411522,"Long":19.4528646,"abbr":"SK"},"Slovenia": {"Lat":45.8133113,"Long":14.4808369,"abbr":"SI"},"Spain": {"Lat":40,"Long":-3.25,"abbr":"ES"},"Sweden": {"Lat":59.6749712,"Long":14.5208584,"abbr":"SE"},"Switzerland": {"Lat":46.7985624,"Long":8.2319736,"abbr":"CH"},"Turkey": {"Lat":38.9597594,"Long":34.9249653,"abbr":"TR"},"Ukraine": {"Lat":49.4871968,"Long":31.2718321,"abbr":"UA"},"United Kingdom": {"Lat":54.7023545,"Long":-3.2765753,"abbr":"GB"}}

function getHashValue(key) {
  let matches = location.hash.match(new RegExp(key+'=([^&]*)'));
  return matches ? matches[1] : null;
}

const l = getHashValue('l') ? getHashValue('l') : 'en';
const area = getHashValue('area') ? getHashValue('area') : '';
const type = 'vaccinated';

const projection = (area === 'erno') ? d3.geoAzimuthalEquidistant().center([25,46]).scale(3000) :  d3.geoAzimuthalEquidistant().center([33,57]).scale(800);
const data_file_name = (area === 'erno') ? 'data_erno.json' : 'data.json';
const multiplier = (area === 'erno') ? 15 : 5;

class App extends Component {
  constructor(props) {
    super(props);
    
    this.state = {
      data:{},
      dates:[],
      total_cases:0,
      total_vaccinated:0,
      year_month_idx:0
    }
  }
  componentDidMount() {
    d3.json('./data/' + data_file_name).then((data) => {
      this.setState((state, props) => ({
        vaccinated:data.vaccinated,
        dates:_.keys(data[type]['Albania']).filter((value, index, arr) => {
          return !(value === 'Province_State');
        })
      }), this.drawMap);
    })
    .catch(function (error) {
    })
    .then(function () {
    });
  }
  drawMap() {
    let width = 720;
    let height = 720;
    
    let svg = d3.select('.' + style.map_container).append('svg').attr('width', width).attr('height', height);
    path = d3.geoPath().projection(projection);
    g = svg.append('g');

    let tooltip = d3.select('.' + style.map_container)
      .append('div')
      .attr('class', style.hidden + ' ' + style.tooltip);
    d3.json('./data/europe.topojson').then((topology) => {
      g.selectAll('path').data(topojson.feature(topology, topology.objects.europe).features)
        .enter()
        .append('path')
        .attr('d', path)
        .attr('class', style.path)
        .style('stroke', (d, i) => {
          return '#999';
        })
        .attr('fill', (d, i) => {
          return this.getAreaColor(d.properties.NAME);
        });

      let data = Object.keys(this.state[type]).map(i => this.state[type][i]);

      g.selectAll('circle').data(data)
        .enter()
        .append('circle')
        .attr('cx', (d, i) => {
          return projection([areaInfo[d.Province_State].Long, areaInfo[d.Province_State].Lat])[0];
        })
        .attr('cy', (d, i) => {
          return projection([areaInfo[d.Province_State].Long, areaInfo[d.Province_State].Lat])[1];
        })
        .attr('r', (d, i) => {
          return 0;
        })
        .attr('class', style.circle)
        .style('fill', 'rgba(255, 82, 51, 0.75)');

      g.selectAll('text').data(data)
        .enter()
        .append('text')
        .attr('text-anchor', 'middle')
        .attr('alignment-baseline', 'central')
        .attr('class', style.number)
        .attr('x', (d, i) => {
          return projection([areaInfo[d.Province_State].Long, areaInfo[d.Province_State].Lat])[0] + 0.3;
        })
        .attr('y', (d, i) => {
          return projection([areaInfo[d.Province_State].Long, areaInfo[d.Province_State].Lat])[1] + 1;
        })
        .html('')
      this.text = svg.append('text')
        .attr('alignment-baseline', 'top')
        .attr('class', style.text)
        .attr('text-anchor', 'middle')
        .attr('x', '50%')
        .attr('y', '7%');
        let date = this.state.dates[this.state.year_month_idx].split('-');
        this.text.html('' + date[2] + '.' + date[1] + '.' + date[0]);
    });
    setTimeout(() => {
      this.createInterval();
    }, 1000);
  }
  changeAreaAttributes() {
    // Change fill color.
    g.selectAll('path')
      .attr('fill', (d, i) => {
        return this.getAreaColor(d.properties.NAME);
      });
    g.selectAll('circle')
      .attr('r', (d, i) => {
        this.setState((state, props) => ({
          total_cases:d[this.state.dates[this.state.year_month_idx]]
        }));
        return Math.sqrt(d[this.state.dates[this.state.year_month_idx]]) * multiplier;
      });
    g.selectAll('text')
      .style('font-size', (d, i) => {
        return (Math.sqrt(d[this.state.dates[this.state.year_month_idx]]) * (multiplier - 1)) + 'px';
      })
      .html((d, i) => {
        if (this.state.year_month_idx >= (this.state.dates.length - 1)) {
          return parseInt(d[this.state.dates[this.state.year_month_idx]]);
        }
        else if (d[this.state.dates[this.state.year_month_idx]] > 0) {
          return areaInfo[d.Province_State].abbr;
        }
        else {
          return '';
        }
      });
  }
  getAreaColor(area) {
    if (this.state[type][area] !== undefined) {
      if (this.state[type][area][this.state.dates[this.state.year_month_idx]] > 0) {
        return '#d5d5d5';
      }
      else {
        return '#f5f5f5';
      }
    }
    else {
      return '#ffffff'
    }
  }
  onBeforeSliderChange(value) {
    if (interval) {
      clearInterval(interval)
    }
  }
  onSliderChange(value) {
    this.setState((state, props) => ({
      total_cases:0,
      year_month_idx:value
    }), this.changeAreaAttributes);
  }
  onAfterSliderChange(value) {
  }
  componentWillUnMount() {
    clearInterval(interval);
  }
  createInterval() {
    this.changeAreaAttributes();
    interval = setInterval(() => {
      this.setState((state, props) => ({
        total_cases:0,
        year_month_idx:this.state.year_month_idx + 1
      }), this.changeAreaAttributes);
      if (this.state.year_month_idx >= (this.state.dates.length - 1)) {
        clearInterval(interval);
        g.selectAll('text')
          .html((d, i) => {
            return parseInt(d[this.state.dates[this.state.year_month_idx]]);
          });
        setTimeout(() => {
          this.setState((state, props) => ({
            total_cases:0,
            year_month_idx:0
          }), this.createInterval);
        }, 4000);
      }
    }, 500);
  }
  render() {
    if (this.text) {
      if (this.state.dates[this.state.year_month_idx]) {
        let date = this.state.dates[this.state.year_month_idx].split('-');
        this.text.html('' + date[2] + '.' + date[1] + '.' + date[0]);
      }
    }
    return (
      <div className={style.plus}>
        <div>
          <Slider
            className={style.slider_container}
            dots={false}
            max={this.state.dates.length - 1}
            onAfterChange={this.onAfterSliderChange.bind(this)}
            onBeforeChange={this.onBeforeSliderChange}
            onChange={this.onSliderChange.bind(this)}
            value={this.state.year_month_idx}
          />
          <div className={style.map_container}></div>
        </div>
      </div>
    );
  }
}
export default App;