import React, { Component } from 'react';
import { connect } from 'react-redux';
import { formatTokenCount } from '../../utils/formatters';

class ContextDescription extends Component {
  constructor(props) {
    super(props);

    this.formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    });
  }

  formattedBalance() {
    return EthTools.formatBalance(
      web3.utils.toBN(this.props.value || 0),
      '0,0.00[0000000000000000]',
      'ether'
    );
  }

  calculateTransferValue() {
    const { value, etherPriceUSD } = this.props;

    if (!value || !etherPriceUSD) {
      return;
    }

    const bigValue = web3.utils.isHex(value)
      ? new BigNumber(web3.utils.hexToNumberString(value))
      : new BigNumber(value);
    const fee = bigValue
      .times(etherPriceUSD)
      .dividedBy(new BigNumber('1000000000000000000'));
    return this.formatter.format(fee);
  }

  alertIfSendingEther() {
    if (!this.props.value) return null;

    return (
      <div className="context-description__send-eth-alert">
        Ether Amount:{' '}
        <span className="bold">{this.formattedBalance()} ETH</span>
      </div>
    );
  }

  determineTxType() {
    if (this.props.isNewContract) return 'newContract';
    if (this.props.toIsContract) {
      if (this.props.executionFunction === 'transfer(address,uint256)') {
        return 'tokenTransfer';
      } else {
        return 'genericFunctionExecution';
      }
    }
    return 'etherTransfer';
  }

  renderNewContractDescription() {
    const bytesCount = encodeURI(this.props.data).split(/%..|./).length - 1;

    return (
      <div className="context-description__sentence">
        <div>
          Upload <span className="bold">New Contract</span>
        </div>
        <div className="context-description__subtext">
          About {bytesCount} bytes
        </div>

        {this.alertIfSendingEther()}
      </div>
    );
  }

  renderTokenTransferDescription() {
    const { params, token } = this.props;
    if (params.length === 0) return;

    const tokenCount = formatTokenCount(params[1].value, token.decimals);

    const tokenSymbol = token.symbol || i18n.t('mist.sendTx.tokens');

    return (
      <div className="context-description__sentence">
        {i18n.t('mist.sendTx.transfer')}{' '}
        <span className="bold">
          {tokenCount} {tokenSymbol}
        </span>
        {this.alertIfSendingEther()}
      </div>
    );
  }

  renderGenericFunctionDescription() {
    const { executionFunction } = this.props;

    let executionFunctionClean =
      executionFunction.charAt(0).toUpperCase() +
      executionFunction
        .slice(1, executionFunction.indexOf('('))
        .replace(/([A-Z]+|[0-9]+)/g, ' $1');

    return (
      <div className="context-description__sentence">
        Execute{' '}
        {executionFunctionClean ? (
          <React.Fragment>
            <span className="bold">&#8220;{executionFunctionClean}&#8221;</span>{' '}
            function
          </React.Fragment>
        ) : (
          <span className="bold">contract function</span>
        )}
        {this.alertIfSendingEther()}
      </div>
    );
  }

  renderEtherTransferDescription() {
    let conversion;
    if (this.props.network === 'main') {
      const value = this.calculateTransferValue();
      if (value) {
        conversion = <span>About {value} USD</span>;
      }
    } else {
      conversion = (
        <span>
          $0 (<span className="capitalize">{this.props.network}</span>)
        </span>
      );
    }

    return (
      <div className="context-description__sentence">
        <div>
          Transfer <span className="bold">{this.formattedBalance()} ETHER</span>
        </div>
        <div className="context-description__subtext">{conversion}</div>
      </div>
    );
  }

  renderDescription() {
    const txType = this.determineTxType();
    switch (txType) {
      case 'newContract':
        return this.renderNewContractDescription();
      case 'tokenTransfer':
        return this.renderTokenTransferDescription();
      case 'genericFunctionExecution':
        return this.renderGenericFunctionDescription();
      case 'etherTransfer':
        return this.renderEtherTransferDescription();
      default:
        return this.renderEtherTransferDescription();
    }
  }

  render() {
    return (
      <div className="context-description">
        {this.renderDescription()}
        {!!this.props.gasError && (
          <div className="context-description__error">
            Warning: this transaction is likely going to fail and burn your
            fees.
          </div>
        )}
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    data: state.newTx.data,
    executionFunction: state.newTx.executionFunction,
    gasError: state.newTx.gasError,
    isNewContract: state.newTx.isNewContract,
    network: state.nodes.network,
    params: state.newTx.params,
    etherPriceUSD: state.settings.etherPriceUSD,
    toIsContract: state.newTx.toIsContract,
    value: state.newTx.value,
    token: state.newTx.token
  };
}

export default connect(mapStateToProps)(ContextDescription);
