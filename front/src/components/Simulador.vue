<template>
  <v-form v-model="valid" ref="form">
    <v-container>
      <v-row>
        <v-col cols="simulado ? '8' : '12'">
          <v-card :loading="loading">
            <v-card-title>Simular Empréstimo</v-card-title>
            <v-card-text>
              <v-text-field label="Valor do empréstimo" hide-details="auto" v-model.lazy="valor" v-money="moeda" :rules="valorRules" required></v-text-field>
              <v-spacer></v-spacer>
              <v-select
                item-value="chave"
                item-text="valor"
                multiple
                :items="instituicoes"
                label="Instituição"
                @input="selecionarInstituicao"
              ></v-select>
              <v-select
                item-value="chave"
                item-text="valor"
                multiple
                :items="convenios"
                label="Convênio"
                @input="selecionarConvenio"
              ></v-select>
              <v-select
                item-value="chave"
                item-text="valor"
                :items="parcelas"
                label="Parcelas"
                @input="selecionarParcela"
              ></v-select>
            </v-card-text>
            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn 
                color="blue"
                @click="simular"
                :disabled="loading"
              >Simular</v-btn>
            </v-card-actions>
          </v-card>
        </v-col>

        <v-col cols="4" v-show="simulado">
          <v-card>
            <v-card-title>Opções de Empréstimo</v-card-title>
            <v-card-text v-if="!loading">
              <template v-if="simulacoes.length > 0">
                <template v-for="(simulacao, index) in simulacoes">
                  <v-card class="simulacao" :key="index">
                    <v-card-text>
                      <div>Instituição: {{ simulacao.instituicao }}</div>
                      <div>Solicitado: {{ simulacao.valor_emprestimo || 0 }}</div>
                      <div>Pagamento: <span class="destaque">{{ simulacao.parcelas }} x {{ simulacao.valor_parcela }}</span></div>
                      <div>Juros/mês: {{ simulacao.taxa_juros }}%</div>
                    </v-card-text>
                  </v-card>
                </template>
              </template>
              <template v-else>
                Não foram encontrados opções de empréstimo nas condições informadas.
              </template>
            </v-card-text>
            <v-card-text v-else>
              Buscando novas opções de empréstimo, por favor aguarde...
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </v-form>
</template>

<style lang="scss">
  .destaque {
    color: #b82d2d;
    font-weight: bold;
  }

  .simulacao {
    margin-bottom: 10px !important;

    &:last-child {
      margin-bottom: 0 !important;
    }
  }
</style>

<script>
  import { VMoney } from 'v-money';
  import SimuladorService from '../services/SimuladorService';
  
  export default {
    name: 'Simulador',

    directives: { 
      money: VMoney
    },

    data: () => ({
      loading: true,
      valid: true,
      instituicoes: [],
      convenios: [],
      parcelas: [36,48,60,72,84],
      simulado: false,
      valor: 0,
      valor_emprestimo: 0,
      moeda: {
        decimal: ',',
        thousands: '.',
        prefix: 'R$ ',
        precision: 2
      },
      valorRules: [
        v => !!v || 'Valor do empréstimo é obrigatório',
        v => {
          if (v) {
            v = v || 0;
            const valueParts = v.split(' ');
            const valor_emprestimo = +(valueParts[1].replace(/[.]/g, '').replace(/[,]/g, '.'));
            
            if (valor_emprestimo <= 0) {
              return 'Valor do empréstimo deve ser maior do que R$ 0,00';
            }

            return true;
          }

          return false;
        }
      ],
      instituicao: Array(),
      convenio: Array(),
      parcela: null,
      simulacoes: Array()
    }),

    mounted: function () {
      Promise
        .all([SimuladorService.getInstituicoes(), SimuladorService.getConvenios()])
        .then((data) => {
          data[0].map((obj) => {
            this.instituicoes.push(obj) ;
          });
          
          data[1].map((obj) => {
            this.convenios.push(obj);
          });
        })
        .finally(() => {
          this.loading = false;
        });
    },

    methods: {
      selecionarInstituicao(instituicao) {
        this.instituicao = instituicao;
      },

      selecionarConvenio(convenio) {
        this.convenio = convenio;
      },

      selecionarParcela(parcela) {
        this.parcela = parcela;
      },

      simular() {
        if (this.validate()) {
          let data = {  };

          const valueParts = this.valor.split(' ');
          this.valor_emprestimo = +(valueParts[1].replace(/[.]/g, '').replace(/[,]/g, '.'));
          
          if (typeof this.valor_emprestimo === "number") {
            data.valor_emprestimo = this.valor_emprestimo;
          }

          if (typeof this.instituicao === "object") {
            let instituicoes = Array();
            this.instituicao.map((instituicao) => {
              instituicoes.push(instituicao);
            });

            data.instituicoes = instituicoes;
          }

          if (typeof this.convenio === "object") {
            let convenios = Array();
            this.convenio.map((convenio) => {
              convenios.push(convenio);
            });

            data.convenios = convenios;
          }

          if (typeof this.parcela === "number" && this.parcelas.includes(this.parcela)) {
            data.parcelas = this.parcela;
          } else {
            data.parcelas = 0;
          }

          this.loading = true;

          Promise
            .all([SimuladorService.simular(data)])
            .then((data) => {
              this.processarSimulacao(data);
            })
            .finally(() => {
              this.loading = false;
            });
        }
      },

      validate() {
        return this.$refs.form.validate();
      },

      processarSimulacao(simulacao) {
        this.simulacoes = Array();

        const data = simulacao[0];

        Object.keys(data).map((instituicao) => {
          Object.keys(data[instituicao]).map((index) => {
            const simulacao = data[instituicao][index];
            
            const valor_parcela_f = simulacao.valor_parcela.toLocaleString('pt-br', {style: 'currency', currency: 'BRL'});

            const opcao = {
              instituicao: instituicao,
              parcelas: simulacao.parcelas,
              valor_parcela: valor_parcela_f,
              taxa_juros: simulacao.taxa,
              valor_emprestimo: this.valor
            };

            this.simulacoes.push(opcao);
          });
        });

        this.simulado = true;
      }
    }
  }
</script>
